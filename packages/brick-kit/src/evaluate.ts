import { cloneDeep } from "lodash";
import i18next from "i18next";
import {
  cook,
  hasOwnProperty,
  isEvaluable,
  preevaluate,
} from "@easyops/brick-utils";
import { _internalApiGetCurrentContext } from "./core/Runtime";
import { getUrlBySegueFactory } from "./segue";
import { getUrlByAliasFactory } from "./alias";
import { getUrlByImageFactory } from "./image";
import { devtoolsHookEmit } from "./devtools";
import { customProcessorRegistry } from "./core/exports";

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
}

export function isPreEvaluated(raw: unknown): raw is PreEvaluated {
  return !!(raw as PreEvaluated)?.[symbolForRaw];
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
  let precooked: ReturnType<typeof preevaluate>;
  try {
    precooked = preevaluate(raw);
  } catch (error) {
    if (options.isReEvaluation) {
      devtoolsHookEmit("re-evaluation", {
        id: options.evaluationId,
        detail: { raw, context: {} },
        error: error.message,
      });
      return;
    } else {
      throw error;
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
    app,
    query,
    match,
    sys,
    flags,
    hash,
    segues,
    images,
    storyboardContext,
  } = _internalApiGetCurrentContext();

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

  if (attemptToVisitGlobals.has("IMAGES")) {
    globalVariables.IMAGES = {
      getUrl: getUrlByImageFactory(images),
    };
  }

  if (attemptToVisitGlobals.has("I18N")) {
    globalVariables.I18N = i18next.getFixedT(null, `$app-${app.id}`);
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
      Array.from(
        customProcessorRegistry.entries()
      ).map(([namespace, registry]) => [
        namespace,
        Object.fromEntries(registry.entries()),
      ])
    );
  }

  try {
    const result = cook(precooked, globalVariables);
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
      throw new SyntaxError(message);
    }
  }
}
