import { isObject } from "@next-core/utils/general";

let computed = new WeakSet();

// The computed (or transformed) result should never be *computed* again.
// So does the fetched data from a remote api.
export function markAsComputed(value: unknown): void {
  if (isObject(value)) {
    if (!hasBeenComputed(value)) {
      computed.add(value);
      if (Array.isArray(value)) {
        value.forEach(markAsComputed);
      } else {
        // Only mark pure objects.
        const proto = Object.getPrototypeOf(value);
        if (!proto || proto.constructor === Object) {
          Object.values(value).forEach(markAsComputed);
        }
      }
    }
  }
}

export function hasBeenComputed(object: unknown): boolean {
  return computed.has(object as object);
}

export function resetAllComputed(): void {
  computed = new WeakSet();
}
