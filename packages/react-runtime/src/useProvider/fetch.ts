import { FetchArgs } from "./useProviderTypes.js";
import { fetchByProvider } from "@next-core/runtime";

const cacheMap: Map<string, Promise<unknown>> = new Map();

function isObj(v: any): boolean {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isString(v: any): v is string {
  return typeof v === "string";
}
function buildSortedCacheKey(provider: string, ...args: any): string {
  const sortObj = (obj: Record<string, any>) =>
    Object.keys(obj)
      .sort()
      .map((k) => ({ [k]: (obj as any)[k] }));
  try {
    const sortedArgs = isObj(args)
      ? sortObj(args)
      : (args as Record<string, any>[]).map((arg) =>
          isString(arg) ? arg : sortObj(arg)
        );

    return JSON.stringify({
      provider,
      args: sortedArgs,
    });
  } catch (e) {
    return JSON.stringify({
      provider,
      args,
    });
  }
}

export default async function fetch<TData>(
  provider: string,
  cache: boolean,
  args: FetchArgs
): Promise<TData> {
  let promise: Promise<TData>;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const cacheKey = buildSortedCacheKey(provider, ...args);
  !cache && cacheMap.has(cacheKey) && cacheMap.delete(cacheKey);

  if (cacheMap.has(cacheKey)) {
    promise = cacheMap.get(cacheKey) as Promise<TData>;
  } else {
    promise = (() => {
      return fetchByProvider(provider, args) as Promise<TData>;
    })();

    cache && cacheMap.set(cacheKey, promise);
  }

  return promise;
}
