import { isObject } from "@next-core/brick-utils";
import { isPreEvaluated } from "./evaluate";
import { symbolForTplContextId } from "../core/CustomTemplates/constants";

let injected = new WeakSet();

// The injected (or transformed) result should never be *injected* again.
// So does the fetched data from a remote api.
export function recursiveMarkAsInjected(value: any): void {
  if (isObject(value)) {
    if (!haveBeenInjected(value)) {
      injected.add(value);
      if (Array.isArray(value)) {
        value.forEach(recursiveMarkAsInjected);
      } else {
        // Only mark pure objects.
        const proto = Object.getPrototypeOf(value);
        if (!proto || proto.constructor === Object) {
          Object.values(value).forEach(recursiveMarkAsInjected);
        }
      }
    }
  }
}

export function haveBeenInjected(object: any): boolean {
  return injected.has(object);
}

export function resetAllInjected(): void {
  injected = new WeakSet();
}

export function cloneDeepWithInjectedMark<T>(value: T): T {
  if (isObject(value) && !isPreEvaluated(value)) {
    const clone = Array.isArray(value)
      ? (value as unknown[]).map((item) => cloneDeepWithInjectedMark(item))
      : Object.fromEntries(
          // Get both string and symbol keys.
          Object.entries(value)
            .map(([k, v]) => [k, cloneDeepWithInjectedMark(v)])
            .concat(
              Object.getOwnPropertySymbols(value).map((k) => [
                k,
                (value as Record<string | symbol, unknown>)[k],
              ])
            )
        );
    if (haveBeenInjected(value)) {
      injected.add(clone);
    }
    return clone as any;
  }
  return value;
}
