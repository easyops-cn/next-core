import { cloneDeep } from "lodash";
import {
  cook,
  hasOwnProperty,
  isEvaluable,
  preevaluate,
  PreevaluateResult,
  shouldAllowRecursiveEvaluations,
} from "@next-core/brick-utils";
import { supply } from "@next-core/supply";
import type { PluginRuntimeContext } from "@next-core/brick-types";
import { _internalApiGetCurrentContext } from "../core/Runtime";
import { getUrlBySegueFactory } from "./segue";
import { getUrlByAliasFactory } from "./alias";
import { widgetImagesFactory } from "./images";
import { devtoolsHookEmit } from "./devtools";
import { customProcessorRegistry } from "../core/exports";
import { getItemFactory } from "./Storage";
import { getRuntime } from "../runtime";
import { storyboardFunctions } from "../core/StoryboardFunctions";
import { widgetFunctions } from "../core/WidgetFunctions";
import { widgetI18nFactory } from "../core/WidgetI18n";
import { getGeneralGlobals } from "./getGeneralGlobals";
import { getReadOnlyProxy, getDynamicReadOnlyProxy } from "./proxyFactories";
import { getCustomTemplateContext } from "../core/CustomTemplates/CustomTemplateContext";
import { getMenu } from "./menu";
import { getMedia } from "./mediaQuery";
import { getCustomFormContext } from "../core/CustomForms/CustomFormContext";

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

export type EvaluateRuntimeContext = Omit<
  PluginRuntimeContext,
  "sys" | "flags" | "storyboardContext"
> & {
  data?: unknown;
};

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
  const attemptToVisitState = attemptToVisitGlobals.has("STATE");
  const attemptToVisitFormState = attemptToVisitGlobals.has("FORM_STATE");
  const attemptToVisitTplOrState = attemptToVisitTpl || attemptToVisitState;

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

  const missingTplOrState =
    attemptToVisitTplOrState && !hasOwnProperty(runtimeContext, "tplContextId");
  const missingData =
    attemptToVisitData && !hasOwnProperty(runtimeContext, "data");

  const rawWithContext =
    Object.keys(runtimeContext).length > 0
      ? ({
          [symbolForRaw]: raw,
          [symbolForContext]: runtimeContext,
        } as PreEvaluated)
      : raw;

  // Since `EVENT`, `DATA`, `TPL` and `STATE` are provided in different context,
  // whenever missing one of them, memorize the current context for later consuming.
  if (missingEvent || missingData || missingTplOrState) {
    return rawWithContext;
  }

  if (attemptToVisitData) {
    globalVariables.DATA = runtimeContext.data;
  }

  if (attemptToVisitTplOrState && runtimeContext.tplContextId) {
    const tplContext = getCustomTemplateContext(runtimeContext.tplContextId);
    if (attemptToVisitTpl) {
      globalVariables.TPL = tplContext.getVariables();
    }
    if (attemptToVisitState) {
      globalVariables.STATE = getDynamicReadOnlyProxy({
        get(target, key: string) {
          return tplContext.state.getValue(key);
        },
        ownKeys() {
          return Array.from(tplContext.state.get().keys());
        },
      });
    }
  }

  if (attemptToVisitFormState && runtimeContext.formContextId) {
    const formContext = getCustomFormContext(runtimeContext.formContextId);
    globalVariables.FORM_STATE = getDynamicReadOnlyProxy({
      get(target, key: string) {
        return formContext.formState.getValue(key);
      },
      ownKeys() {
        return Array.from(formContext.formState.get().keys());
      },
    });
  }

  const internalContext = _internalApiGetCurrentContext();
  const mergedContext: PluginRuntimeContext = {};

  // Use runtime context over internal context.
  // Internal context such as `match`, maybe change after `history.push`.
  // So we prefer memoized runtime context.
  for (const key of [
    "query",
    "match",
    "hash",
    "pathname",
    "app",
    "segues",
  ] as const) {
    mergedContext[key as "query"] = (
      hasOwnProperty(runtimeContext, key) ? runtimeContext : internalContext
    )[key as "query"];
  }

  const {
    app: currentApp,
    query,
    match,
    hash,
    pathname,
    segues,
  } = mergedContext;
  const { sys, flags, storyboardContext } = internalContext;

  const app = runtimeContext.overrideApp ?? currentApp;

  function getIndividualGlobal(variableName: string): unknown {
    switch (variableName) {
      case "ALIAS":
        return {
          getUrl: getUrlByAliasFactory(app),
        };
      case "ANCHOR":
        return hash ? hash.substr(1) : null;
      case "APP":
        return {
          ...cloneDeep(app),
          getMenu,
        };
      case "CTX":
        return getDynamicReadOnlyProxy({
          get(target, key: string) {
            const item = storyboardContext.get(key);
            return !item
              ? item
              : item.type === "brick-property"
              ? item.brick.element?.[item.prop as keyof HTMLElement]
              : item.value;
          },
          ownKeys() {
            return Array.from(storyboardContext.keys());
          },
        });
      case "FLAGS":
        return getReadOnlyProxy(flags);
      case "HASH":
        return hash;
      case "PATH_NAME":
        return pathname;
      case "INSTALLED_APPS":
        return {
          has: (appId: string, matchVersion?: string) =>
            getRuntime().hasInstalledApp(appId, matchVersion),
        };
      case "LOCAL_STORAGE":
        return {
          getItem: getItemFactory("local"),
        };
      case "MISC":
        return getRuntime().getMiscSettings();
      case "PARAMS":
        return new URLSearchParams(query);
      case "PATH":
        return getReadOnlyProxy(match.params);
      case "PROCESSORS":
        return getDynamicReadOnlyProxy({
          get(target, key: string) {
            const pkg = customProcessorRegistry.get(key);
            if (!pkg) {
              throw new Error(
                `'PROCESSORS.${key}' is not registered! Have you installed the relevant brick package of '${key.replace(
                  /[A-Z]/g,
                  (m) => `-${m.toLowerCase()}`
                )}-NB'?`
              );
            }
            return getDynamicReadOnlyProxy({
              get(t, k: string) {
                return pkg.get(k);
              },
              ownKeys() {
                return Array.from(pkg.keys());
              },
            });
          },
          ownKeys() {
            return Array.from(customProcessorRegistry.keys());
          },
        });
      case "QUERY":
        return Object.fromEntries(
          Array.from(query.keys()).map((key) => [key, query.get(key)])
        );
      case "QUERY_ARRAY":
        return Object.fromEntries(
          Array.from(query.keys()).map((key) => [key, query.getAll(key)])
        );
      case "SEGUE":
        return {
          getUrl: getUrlBySegueFactory(app, segues),
        };
      case "SESSION_STORAGE":
        return {
          getItem: getItemFactory("session"),
        };
      case "SYS":
        return getReadOnlyProxy(sys);
      case "MEDIA":
        return getReadOnlyProxy(getMedia());
      case "__WIDGET_FN__":
        return widgetFunctions;
      case "__WIDGET_IMG__":
        return widgetImagesFactory;
      case "__WIDGET_I18N__":
        return widgetI18nFactory;
    }
  }

  for (const variableName of attemptToVisitGlobals) {
    const variable = getIndividualGlobal(variableName);
    if (variable !== undefined) {
      globalVariables[variableName] = variable;
    }
  }

  Object.assign(
    globalVariables,
    getGeneralGlobals(precooked.attemptToVisitGlobals, {
      storyboardFunctions,
      app,
      appendI18nNamespace: runtimeContext.appendI18nNamespace,
    })
  );

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
