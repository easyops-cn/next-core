import { isCustomApiProvider } from "../../core/FlowApi";
import { RefreshableProvider } from "../../internal/makeProviderRefreshable";
import { FetchArgs } from "./useProviderTypes";
import { _internalApiGetProviderBrick } from "../../core/Runtime";
import { CustomApi } from "../../providers/CustomApi";

const cache: Map<string, Promise<any>> = new Map();

export default async function fetch<TData>(
  provider: string,
  ...args: FetchArgs
): Promise<TData> {
  const cacheKey = JSON.stringify({
    provider,
    args,
  });

  let promise: Promise<TData>;

  if (cache.has(cacheKey)) {
    promise = cache.get(cacheKey);
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
    cache.set(cacheKey, promise);
  }

  return promise;
}
