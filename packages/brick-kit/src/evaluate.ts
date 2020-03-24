import { cloneDeep } from "lodash";
import { precook, cook, hasOwnProperty } from "@easyops/brick-utils";
import { _internalApiGetCurrentContext } from "./core/Runtime";

export function isCookable(raw: string): boolean {
  return /^<%\s/.test(raw) && /\s%>$/.test(raw);
}

export function evaluate(
  raw: string,
  runtimeContext: {
    event?: CustomEvent;
    data?: any;
  } = {}
): any {
  const source = raw.substring(3, raw.length - 3);
  let precooked: ReturnType<typeof precook>;

  try {
    precooked = precook(source);
  } catch (error) {
    throw new SyntaxError(`${error.message}, in "${raw}"`);
  }

  const globalVariables: Record<string, any> = {};
  const attemptToVisitGlobals = precooked.attemptToVisitGlobals;

  const attemptToVisitEvent = attemptToVisitGlobals.has("EVENT");
  const attemptToVisitData = attemptToVisitGlobals.has("DATA");

  if (attemptToVisitEvent && attemptToVisitData) {
    throw new Error("You can't use both `EVENT` and `DATA`");
  }

  // Ignore evaluating if the `runtime` doesn't provide the `event`.
  // Since it should be evaluated during events handling.
  if (attemptToVisitEvent) {
    if (hasOwnProperty(runtimeContext, "event")) {
      globalVariables.EVENT = runtimeContext.event;
    } else {
      return raw;
    }
  }

  // Ignore evaluating if the `runtime` doesn't provide the `data`.
  // Since it should be evaluated during transforming.
  if (attemptToVisitData) {
    if (hasOwnProperty(runtimeContext, "data")) {
      globalVariables.DATA = runtimeContext.data;
    } else {
      return raw;
    }
  }

  const {
    app,
    query,
    match,
    sys,
    flags,
    hash
  } = _internalApiGetCurrentContext();

  if (attemptToVisitGlobals.has("QUERY")) {
    globalVariables.QUERY = Object.fromEntries(
      Array.from(query.keys()).map(key => [key, query.get(key)])
    );
  }
  if (attemptToVisitGlobals.has("QUERY_ARRAY")) {
    globalVariables.QUERY_ARRAY = Object.fromEntries(
      Array.from(query.keys()).map(key => [key, query.getAll(key)])
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

  try {
    return cook(precooked, globalVariables);
  } catch (error) {
    throw new SyntaxError(`${error.message}, in "${raw}"`);
  }
}
