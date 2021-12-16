import { cloneDeep } from "lodash";
import i18next from "i18next";
import {
  cook,
  hasOwnProperty,
  isEvaluable,
  preevaluate,
  PreevaluateResult,
  shouldAllowRecursiveEvaluations,
} from "@next-core/brick-utils";
import { supply } from "@next-core/supply";
import { MicroApp } from "@next-core/brick-types";
import { _internalApiGetCurrentContext } from "../core/Runtime";
import { getUrlBySegueFactory } from "./segue";
import { getUrlByAliasFactory } from "./alias";
import { imagesFactory, widgetImagesFactory } from "./images";
import { devtoolsHookEmit } from "./devtools";
import { customProcessorRegistry } from "../core/exports";
import { checkPermissions } from "./checkPermissions";
import { getItemFactory } from "./Storage";
import { getRuntime } from "../runtime";
import { i18nText } from "../i18nText";
import { storyboardFunctions } from "../core/StoryboardFunctions";
import { widgetFunctions } from "../core/WidgetFunctions";
import { widgetI18nFactory } from "../core/WidgetI18n";
import { getI18nNamespace } from "../i18n";
import { getBasePath } from "./getBasePath";

const symbolForRaw = Symbol.for("pre.evaluated.raw");
const symbolForContext = Symbol.for("pre.evaluated.context");

export interface PreEvaluated {
  [symbolForRaw]: string;
  [symbolForContext]: EvaluateRuntimeContext;
}

export interface EvaluateOptions {
  lazy?: boolean;
  isReEvaluation?: boolean;
  evaluationId?: number;
}

export interface EvaluateRuntimeContext {
  event?: CustomEvent;
  data?: unknown;
  getTplVariables?: () => Record<string, unknown>;
  overrideApp?: MicroApp;
}

export function isPreEvaluated(raw: unknown): raw is PreEvaluated {
  return !!(raw as PreEvaluated)?.[symbolForRaw];
}

export function shouldDismissRecursiveMarkingInjected(
  raw: string | PreEvaluated
): boolean {
  if (typeof raw === "string") {
    return shouldAllowRecursiveEvaluations(raw);
  }
  return shouldAllowRecursiveEvaluations(raw[symbolForRaw]);
}

const possibleErrorConstructs = new WeakSet<ErrorConstructor>([
  SyntaxError,
  TypeError,
  ReferenceError,
]);

export function getCookErrorConstructor(error: any): ErrorConstructor {
  return possibleErrorConstructs.has(error.constructor)
    ? error.constructor
    : TypeError;
}

// `raw` should always be asserted to `isEvaluable` or `isPreEvaluated`.
export function evaluate(
  raw: string | PreEvaluated, // string or pre-evaluated object.
  runtimeContext: EvaluateRuntimeContext = {},
  options: EvaluateOptions = {}
): unknown {
  if (
    options.isReEvaluation &&
    !(typeof raw === "string" && isEvaluable(raw))
  ) {
    devtoolsHookEmit("re-evaluation", {
      id: options.evaluationId,
      detail: { raw, context: {} },
      error: "Invalid evaluation code",
    });
    return;
  }

  if (typeof raw !== "string") {
    // If the `raw` is not a string, it must be a pre-evaluated object.
    // Then fulfil the context, and restore the original `raw`.
    runtimeContext = {
      ...raw[symbolForContext],
      ...runtimeContext,
    };
    raw = raw[symbolForRaw];
  }

  // A `SyntaxError` maybe thrown.
  let precooked: PreevaluateResult;
  try {
    precooked = preevaluate(raw);
  } catch (error) {
    const message = `${error.message}, in "${raw}"`;
    if (options.isReEvaluation) {
      devtoolsHookEmit("re-evaluation", {
        id: options.evaluationId,
        detail: { raw, context: {} },
        error: message,
      });
      return;
    } else {
      const errorConstructor = getCookErrorConstructor(error);
      throw new errorConstructor(message);
    }
  }

  const globalVariables: Record<string, unknown> = {};
  const attemptToVisitGlobals = precooked.attemptToVisitGlobals;

  const attemptToVisitEvent = attemptToVisitGlobals.has("EVENT");
  const attemptToVisitData = attemptToVisitGlobals.has("DATA");
  const attemptToVisitTpl = attemptToVisitGlobals.has("TPL");

  // Ignore evaluating if `event` is missing in context.
  // Since it should be evaluated during events handling.
  let missingEvent = options.lazy === true;
  if (attemptToVisitEvent) {
    if (hasOwnProperty(runtimeContext, "event")) {
      globalVariables.EVENT = runtimeContext.event;
    } else {
      // Let's see if pre-evaluation is required (store the `data` in context).
      missingEvent = true;
    }
  }

  const missingTpl =
    attemptToVisitTpl && !hasOwnProperty(runtimeContext, "getTplVariables");
  const missingData =
    attemptToVisitData && !hasOwnProperty(runtimeContext, "data");

  const rawWithContext =
    Object.keys(runtimeContext).length > 0
      ? ({
          [symbolForRaw]: raw,
          [symbolForContext]: runtimeContext,
        } as PreEvaluated)
      : raw;

  // Since `EVENT`, `DATA` and `TPL` are provided in different context,
  // whenever missing one of them, memorize the current context for later consuming.
  if (missingEvent || missingData || missingTpl) {
    return rawWithContext;
  }

  if (attemptToVisitData) {
    globalVariables.DATA = runtimeContext.data;
  }

  if (
    attemptToVisitTpl &&
    typeof runtimeContext.getTplVariables === "function"
  ) {
    globalVariables.TPL = runtimeContext.getTplVariables();
  }

  const {
    app: currentApp,
    query,
    match,
    sys,
    flags,
    hash,
    segues,
    storyboardContext,
  } = _internalApiGetCurrentContext();

  const app = runtimeContext.overrideApp ?? currentApp;

  if (attemptToVisitGlobals.has("QUERY")) {
    globalVariables.QUERY = Object.fromEntries(
      Array.from(query.keys()).map((key) => [key, query.get(key)])
    );
  }
  if (attemptToVisitGlobals.has("QUERY_ARRAY")) {
    globalVariables.QUERY_ARRAY = Object.fromEntries(
      Array.from(query.keys()).map((key) => [key, query.getAll(key)])
    );
  }
  if (attemptToVisitGlobals.has("PARAMS")) {
    globalVariables.PARAMS = new URLSearchParams(query);
  }

  if (attemptToVisitGlobals.has("APP")) {
    globalVariables.APP = cloneDeep(app);
  }

  if (attemptToVisitGlobals.has("PATH")) {
    globalVariables.PATH = cloneDeep(match.params);
  }

  if (attemptToVisitGlobals.has("SYS")) {
    globalVariables.SYS = cloneDeep(sys);
  }

  if (attemptToVisitGlobals.has("FLAGS")) {
    globalVariables.FLAGS = cloneDeep(flags);
  }

  if (attemptToVisitGlobals.has("HASH")) {
    globalVariables.HASH = hash;
  }

  if (attemptToVisitGlobals.has("ANCHOR")) {
    globalVariables.ANCHOR = hash ? hash.substr(1) : null;
  }

  if (attemptToVisitGlobals.has("SEGUE")) {
    globalVariables.SEGUE = {
      getUrl: getUrlBySegueFactory(app, segues),
    };
  }

  if (attemptToVisitGlobals.has("ALIAS")) {
    globalVariables.ALIAS = {
      getUrl: getUrlByAliasFactory(app),
    };
  }

  if (attemptToVisitGlobals.has("IMG")) {
    globalVariables.IMG = imagesFactory(app.id, app.isBuildPush);
  }

  if (attemptToVisitGlobals.has("__WIDGET_IMG__")) {
    globalVariables.__WIDGET_IMG__ = widgetImagesFactory;
  }

  if (attemptToVisitGlobals.has("I18N")) {
    globalVariables.I18N = i18next.getFixedT(
      null,
      getI18nNamespace("app", app.id)
    );
  }

  if (attemptToVisitGlobals.has("__WIDGET_I18N__")) {
    globalVariables.__WIDGET_I18N__ = widgetI18nFactory;
  }

  if (attemptToVisitGlobals.has("I18N_TEXT")) {
    globalVariables.I18N_TEXT = i18nText;
  }

  if (attemptToVisitGlobals.has("CTX")) {
    globalVariables.CTX = Object.fromEntries(
      Array.from(storyboardContext.entries()).map(([name, item]) => [
        name,
        item.type === "brick-property"
          ? item.brick.element?.[item.prop as keyof HTMLElement]
          : item.value,
      ])
    );
  }

  if (attemptToVisitGlobals.has("PROCESSORS")) {
    globalVariables.PROCESSORS = Object.fromEntries(
      Array.from(customProcessorRegistry.entries()).map(
        ([namespace, registry]) => [
          namespace,
          Object.fromEntries(registry.entries()),
        ]
      )
    );
  }

  if (attemptToVisitGlobals.has("PERMISSIONS")) {
    globalVariables.PERMISSIONS = {
      check: checkPermissions,
    };
  }

  if (attemptToVisitGlobals.has("LOCAL_STORAGE")) {
    globalVariables.LOCAL_STORAGE = {
      getItem: getItemFactory("local"),
    };
  }

  if (attemptToVisitGlobals.has("SESSION_STORAGE")) {
    globalVariables.SESSION_STORAGE = {
      getItem: getItemFactory("session"),
    };
  }

  if (attemptToVisitGlobals.has("INSTALLED_APPS")) {
    globalVariables.INSTALLED_APPS = {
      has: (appId: string, matchVersion?: string) =>
        getRuntime().hasInstalledApp(appId, matchVersion),
    };
  }

  if (attemptToVisitGlobals.has("FN")) {
    globalVariables.FN = storyboardFunctions;
  }

  if (attemptToVisitGlobals.has("__WIDGET_FN__")) {
    globalVariables.__WIDGET_FN__ = widgetFunctions;
  }

  if (attemptToVisitGlobals.has("MISC")) {
    globalVariables.MISC = getRuntime().getMiscSettings();
  }

  if (attemptToVisitGlobals.has("BASE_URL")) {
    globalVariables.BASE_URL = getBasePath().replace(/\/$/, "");
  }

  try {
    const result = cook(precooked.expression, precooked.source, {
      globalVariables: supply(precooked.attemptToVisitGlobals, globalVariables),
    });
    const detail = { raw, context: globalVariables, result };
    if (options.isReEvaluation) {
      devtoolsHookEmit("re-evaluation", {
        id: options.evaluationId,
        detail,
      });
    } else {
      devtoolsHookEmit("evaluation", detail);
    }
    return result;
  } catch (error) {
    const message = `${error.message}, in "${raw}"`;
    if (options.isReEvaluation) {
      devtoolsHookEmit("re-evaluation", {
        id: options.evaluationId,
        detail: { raw, context: globalVariables },
        error: message,
      });
    } else {
      const errorConstructor = getCookErrorConstructor(error);
      throw new errorConstructor(message);
    }
  }
}
