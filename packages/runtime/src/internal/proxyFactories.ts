import { getDevHook } from "./devtools.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const THROW = (): any => {
  throw new Error("Can't modify read-only proxy object");
};

const readOnlyHandler: ProxyHandler<object> = {
  set: THROW,
  defineProperty: THROW,
  deleteProperty: THROW,
  setPrototypeOf: THROW,
};

export function getReadOnlyProxy<T extends object>(object: T): T {
  return new Proxy<T>(object, readOnlyHandler);
}

// First, we want to make accessing property of globals lazy,
// So we use *Proxy* to make a dynamic accessor for each of these globals.
// But we also want to keep them working in devtools.
export function getDynamicReadOnlyProxy({
  get,
  ownKeys,
}: Required<Pick<ProxyHandler<object>, "get" | "ownKeys">>): unknown {
  if (getDevHook()) {
    // In devtools, we extract them at beginning.
    const target = Object.fromEntries(
      (ownKeys(null!) as string[]).map((key) => [key, get(null!, key, null)])
    );
    return getReadOnlyProxy(target);
  }
  return new Proxy(Object.freeze({}), { get });
}
