export type LazyBrickImportFunction = () => Promise<unknown>;

const lazyBrickRegistry = new Map<string, LazyBrickImportFunction>();
const requestsMap = new WeakMap<LazyBrickImportFunction, Promise<unknown>>();
const reverseBrickRegistry = new WeakMap<LazyBrickImportFunction, string[]>();
const bricksLoaded = new Set<string>();

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
  const brickList = ([] as string[]).concat(bricks);
  for (const brick of brickList) {
    if (lazyBrickRegistry.has(brick)) {
      throw new Error(`Lazy brick "${brick}" is already registered`);
    }
    lazyBrickRegistry.set(brick, factoryWrapper);
  }
  reverseBrickRegistry.set(factoryWrapper, brickList);
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
        request.then(() => {
          for (const item of reverseBrickRegistry.get(factory)) {
            bricksLoaded.add(item);
          }
        });
      }
      requests.add(request);
    }
  }
  await Promise.all(requests);
}

export function loadAllLazyBricks(): Promise<void> {
  return loadLazyBricks(lazyBrickRegistry.keys());
}

export function imperativelyLoadLazyBricks(
  bricks: string[]
): Promise<unknown>[] {
  const asyncJobs: Promise<unknown>[] = [];
  if (bricks.some((brick) => !bricksLoaded.has(brick))) {
    asyncJobs.push(loadLazyBricks(bricks));
  }
  return asyncJobs;
}
