import { isObject } from "@easyops/brick-utils";

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
