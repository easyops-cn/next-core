import { cloneDeep } from "lodash";
import { precook, cook, hasOwnProperty } from "@easyops/brick-utils";
import { _internalApiGetCurrentContext } from "./core/Runtime";
import { getUrlFactory } from "./segue";
import { devtoolsHookEmit } from "./devtools";
import { getRuntime } from "./runtime";

const symbolForRaw = Symbol.for("pre.evaluated.raw");
const symbolForContext = Symbol.for("pre.evaluated.context");

interface PreEvaluated {
  [symbolForRaw]: string;
  [symbolForContext]: {
    data?: any;
  };
}

export interface EvaluateOptions {
  lazy?: boolean;
}

export function isPreEvaluated(raw: any): raw is PreEvaluated {
  return !!(raw as PreEvaluated)?.[symbolForRaw];
}

export function isCookable(raw: string): boolean {
  return /^<%\s/.test(raw) && /\s%>$/.test(raw);
}

export function warnPotentialErrorsOfCookable(raw: string): void {
  if (/^\s|\s$/.test(raw) && isCookable(raw.trim())) {
    // eslint-disable-next-line no-console
    console[
      getRuntime().getFeatureFlags()["development-mode"] ? "error" : "warn"
    ](
      `You have possibly inserted leading or trailing whitespace in the evaluate placeholder: "${raw}"`
    );
  }
}

export function evaluate(
  raw: string | PreEvaluated, // string or pre-evaluated object.
  runtimeContext: {
    event?: CustomEvent;
    data?: any;
  } = {},
  options?: EvaluateOptions
): any {
  if (typeof raw !== "string") {
    // If the `raw` is not a string, it must be a pre-evaluated object.
    // Then fulfil the context, and restore the original `raw`.
    runtimeContext = {
      ...raw[symbolForContext],
      ...runtimeContext,
    };
    raw = raw[symbolForRaw];
  }

  let precooked: ReturnType<typeof precook>;

  try {
    const source = raw.substring(3, raw.length - 3);
    precooked = precook(source);
  } catch (error) {
    throw new SyntaxError(`${error.message}, in "${raw}"`);
  }

  const globalVariables: Record<string, any> = {};
  const attemptToVisitGlobals = precooked.attemptToVisitGlobals;

  const attemptToVisitEvent = attemptToVisitGlobals.has("EVENT");
  const attemptToVisitData = attemptToVisitGlobals.has("DATA");

  // Ignore evaluating if `event` is missing in context.
  // Since it should be evaluated during events handling.
  let missingEvent = options?.lazy === true;
  if (attemptToVisitEvent) {
    if (hasOwnProperty(runtimeContext, "event")) {
      globalVariables.EVENT = runtimeContext.event;
    } else {
      // Let's see if pre-evaluation is required (store the `data` in context).
      missingEvent = true;
    }
  }

  // Ignore evaluating if `data` is missing in context.
  // Since it should be evaluated during transforming.
  if (attemptToVisitData) {
    if (hasOwnProperty(runtimeContext, "data")) {
      globalVariables.DATA = runtimeContext.data;
    } else {
      return raw;
    }

    // If attempt to visit both `EVENT` and `DATA`,
    // since `event` and `data` will always be provided in different context,
    // and `event` should always be provided at last,
    // thus we return a pre-evaluated object which contains current context,
    // and let the context to be fulfilled during events handling.
    if (missingEvent) {
      return {
        [symbolForRaw]: raw,
        [symbolForContext]: runtimeContext,
      } as PreEvaluated;
    }
  } else if (missingEvent) {
    // Or if it's a simple event case, leave it to events handling.
    return raw;
  }

  const {
    app,
    query,
    match,
    sys,
    flags,
    hash,
    segues,
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
      getUrl: getUrlFactory(app, segues),
    };
  }

  try {
    const result = cook(precooked, globalVariables);
    devtoolsHookEmit("evaluation", { raw, context: globalVariables, result });
    return result;
  } catch (error) {
    throw new SyntaxError(`${error.message}, in "${raw}"`);
  }
}
