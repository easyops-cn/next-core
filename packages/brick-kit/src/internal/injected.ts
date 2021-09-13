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
      } else if (value.constructor === Object) {
        // Only mark pure objects.
        Object.values(value).forEach(recursiveMarkAsInjected);
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
          Object.entries(value).map(([k, v]) => {
            /**
             * object.entries会丢失symbol属性
             * 对useBrick做特殊处理
             */
            if (k === "useBrick") {
              const result: any = cloneDeepWithInjectedMark(v);
              if (Array.isArray(v)) {
                for (let i = 0; i < v.length; i++) {
                  if (v[i][symbolForTplContextId])
                    result[i][symbolForTplContextId] =
                      v[i][symbolForTplContextId];
                }
              } else {
                if (v[symbolForTplContextId])
                  result[symbolForTplContextId] = v[symbolForTplContextId];
              }
              return [k, v];
            } else {
              return [k, cloneDeepWithInjectedMark(v)];
            }
          })
        );
    if (haveBeenInjected(value)) {
      injected.add(clone);
    }
    return clone as typeof value;
  }
  return value;
}
