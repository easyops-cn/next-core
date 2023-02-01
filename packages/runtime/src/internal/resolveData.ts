import type { ResolveConf, ResolveOptions } from "@next-core/brick-types";
import { computeRealValue } from "./compute/computeRealValue.js";
import { getProviderBrick } from "./getProviderBrick.js";
import { RuntimeContext } from "./RuntimeContext.js";

const cache = new Map<string, Promise<unknown>>();

export async function resolveData(
  resolveConf: ResolveConf,
  runtimeContext: RuntimeContext,
  options?: ResolveOptions
) {
  const { useProvider, method = "resolve", args, transform } = resolveConf;

  const [provider, actualArgs] = await Promise.all([
    getProviderBrick(
      useProvider,
      runtimeContext.brickPackages
    ) as unknown as Promise<Record<string, Function>>,
    computeRealValue(args || [], runtimeContext) as Promise<unknown[]>,
  ]);

  let cacheKey: string;
  try {
    // `actualArgs` may contain circular references, which makes
    // JSON stringify failed, thus we fallback to original args.
    cacheKey = JSON.stringify({
      useProvider,
      method,
      actualArgs,
    });
  } catch (e) {
    cacheKey = JSON.stringify({
      useProvider,
      method,
      args,
    });
  }

  let promise: Promise<unknown> | undefined;
  if (options?.cache !== "reload") {
    promise = cache.get(cacheKey);
  }
  if (!promise) {
    promise = (async () => {
      // actualArgs = await getArgsOfCustomApi(
      //   useProvider,
      //   actualArgs,
      //   method
      // );
      return provider[method](...actualArgs);
    })();

    cache.set(cacheKey, promise);
  }

  const data = await promise;

  if (!transform) {
    return data;
  }

  // Keep backward compatibility of string transform.
  if (typeof transform === "string") {
    return { [transform]: data };
  }

  return computeRealValue(transform, { ...runtimeContext, data });
}

export function clearResolveCache() {
  cache.clear();
}
