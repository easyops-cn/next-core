import { isCustomApiProvider } from "../../core/FlowApi";
import { RefreshableProvider } from "../../internal/makeProviderRefreshable";
import { FetchArgs } from "./useProviderTypes";
import { _internalApiGetProviderBrick } from "../../core/Runtime";
import { CustomApi } from "../../providers/CustomApi";

const cacheMap: Map<string, Promise<any>> = new Map();

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
  ...args: FetchArgs
): Promise<TData> {
  let promise: Promise<TData>;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const cacheKey = buildSortedCacheKey(provider, ...args);
  !cache && cacheMap.has(cacheKey) && cacheMap.delete(cacheKey);

  if (cacheMap.has(cacheKey)) {
    promise = cacheMap.get(cacheKey);
  } else {
    promise = (async () => {
      if (!isCustomApiProvider(provider)) {
        const providerBrick: RefreshableProvider =
          (await _internalApiGetProviderBrick(provider)) as any;

        const providerTagName = providerBrick.tagName.toLowerCase();

        if (!customElements.get(providerTagName)) {
          throw new Error(
            `Provider not defined: "${providerTagName}", please make sure the related package is installed.`
          );
        }
        return providerBrick["resolve"](...args);
      }

      return CustomApi(...(args as Parameters<typeof CustomApi>));
    })();

    cache && cacheMap.set(cacheKey, promise);
  }

  return promise;
}
