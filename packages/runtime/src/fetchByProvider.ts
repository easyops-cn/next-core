import { getProviderBrick } from "./internal/data/getProviderBrick.js";
import {
  ResolveOptions,
  resolveByProvider,
} from "./internal/data/resolveData.js";

export async function fetchByProvider(
  provider: string,
  args: unknown[],
  options?: ResolveOptions
) {
  const providerBrick = (await getProviderBrick(provider)) as unknown as Record<
    string,
    Function
  >;
  return resolveByProvider(providerBrick, provider, "resolve", args, options);
}
