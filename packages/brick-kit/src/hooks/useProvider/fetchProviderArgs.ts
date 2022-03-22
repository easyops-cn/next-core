import { getArgsOfCustomApi } from "../../core/FlowApi";
import { FetchArgs } from "./useProviderTypes";

const cache = new Map<string, FetchArgs>();

export default async function fetchProviderArgs(
  provider: string,
  args: unknown[],
  ...originalArgs: unknown[]
): Promise<FetchArgs> {
  const cacheKey = JSON.stringify({
    provider,
    args,
    originalArgs,
  });

  if (cache.has(cacheKey)) return cache.get(cacheKey);

  const actualArgs = (await getArgsOfCustomApi(provider, [
    ...args,
    ...originalArgs,
  ])) as FetchArgs;
  cache.set(cacheKey, actualArgs);

  return actualArgs;
}
