export function GetterOnlyProxyFactory(
  getter: (target: unknown, key: string) => unknown
): unknown {
  return new Proxy(Object.freeze({}), {
    get: getter,
  });
}

export function ReadPropertyOnlyProxyFactory(object: unknown): unknown {
  return new Proxy(Object.freeze({}), {
    get(target, key: string) {
      return (object as Record<string, unknown>)[key];
    },
  });
}
