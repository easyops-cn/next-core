import { getArgsOfCustomApi } from "../../core/FlowApi";
import { FetchArgs } from "./useProviderTypes";

const cache = new Map<string, FetchArgs>();

export default async function fetchProviderArgs(
  provider: string,
  ...originalArgs: unknown[]
): Promise<FetchArgs> {
  const cacheKey = JSON.stringify({
    provider,
    originalArgs,
  });

  if (cache.has(cacheKey)) return cache.get(cacheKey);

  const args = (await getArgsOfCustomApi(provider, originalArgs)) as FetchArgs;
  cache.set(cacheKey, args);

  return args;
}
