export type LazyBrickImportFunction = () => Promise<unknown>;

const lazyBrickRegistry = new Map<string, LazyBrickImportFunction>();
const requestsMap = new WeakMap<LazyBrickImportFunction, Promise<unknown>>();

export function registerLazyBricks(
  bricks: string | string[],
  factory: LazyBrickImportFunction
): void {
  const factoryWrapper: LazyBrickImportFunction = async () => {
    try {
      window.dispatchEvent(new CustomEvent("request.start"));
      await factory();
    } finally {
      window.dispatchEvent(new CustomEvent("request.end"));
    }
  };
  for (const brick of ([] as string[]).concat(bricks)) {
    if (lazyBrickRegistry.has(brick)) {
      throw new Error(`Lazy brick "${brick}" is already registered`);
    }
    lazyBrickRegistry.set(brick, factoryWrapper);
  }
}

export async function loadLazyBricks(bricks: Iterable<string>): Promise<void> {
  const requests = new Set<Promise<unknown>>();
  for (const brick of bricks) {
    const factory = lazyBrickRegistry.get(brick);
    if (factory) {
      let request = requestsMap.get(factory);
      if (!request) {
        request = factory();
        requestsMap.set(factory, request);
      }
      requests.add(request);
    }
  }
  await Promise.all(requests);
}
