const poolMap = new Map<string, Pool<unknown, unknown>>();

interface Pool<T, S> {
  current: Queue<T, S>;
  fullIds: Map<T, Promise<S>>;
}

interface Queue<T, S> {
  // This promise is corresponding to the aggregatedIds below.
  promise: Promise<S>;
  aggregatedIds: Set<T>;
}

export type ThrottledAggregation<T, R> = (id: T) => Promise<R>;

/**
 * Make a throttled aggregation function.
 *
 * Note: the `id` should be a primitive value, typically a string or a number.
 * If the `id` must be an array or an object, encode it in JSON.
 *
 * @param namespace Should be unique for each purpose.
 * @param request Accept ids, fire request and return the promise.
 * @param select Select the specific data for a specific id in the aggregated result.
 * @param wait Throttle wait time in milliseconds, defaults to 100.
 */
export function makeThrottledAggregation<T extends string | number, S, R>(
  namespace: string,
  request: (ids: T[]) => Promise<S>,
  select: (result: S, id: T) => R,
  wait = 100
): ThrottledAggregation<T, R> {
  // Each namespace share a pool.
  let pool = poolMap.get(namespace) as Pool<T, S>;
  if (!pool) {
    pool = {
      current: null,
      fullIds: new Map(),
    };
    poolMap.set(namespace, pool);
  }

  function enqueue(id: T): Queue<T, S> {
    const aggregatedIds = new Set<T>();
    aggregatedIds.add(id);
    const promise = new Promise<S>((resolve, reject) => {
      setTimeout(() => {
        pool.current = null;
        request([...aggregatedIds]).then(resolve, reject);
      }, wait);
    });
    return {
      promise,
      aggregatedIds,
    };
  }

  return function (id: T) {
    const cached = pool.fullIds.get(id);
    if (cached) {
      return cached.then((r) => select(r, id));
    }
    if (pool.current) {
      pool.current.aggregatedIds.add(id);
    } else {
      pool.current = enqueue(id);
    }
    const { promise } = pool.current;
    pool.fullIds.set(id, promise);
    return promise.then((r) => select(r, id));
  };
}
