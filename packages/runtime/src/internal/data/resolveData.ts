import type {
  HandleReject,
  HandleRejectByTransform,
  ResolveConf,
  ResolveOptions,
  RuntimeContext,
} from "@next-core/brick-types";
import { asyncComputeRealValue } from "../compute/computeRealValue.js";
import { getProviderBrick } from "./getProviderBrick.js";

const cache = new Map<string, Promise<unknown>>();

export async function resolveData(
  resolveConf: ResolveConf,
  runtimeContext: RuntimeContext,
  options?: ResolveOptions
) {
  const { useProvider, method = "resolve", args, onReject } = resolveConf;

  const [provider, actualArgs] = await Promise.all([
    getProviderBrick(
      useProvider,
      runtimeContext.brickPackages
    ) as unknown as Promise<Record<string, Function>>,
    asyncComputeRealValue(args || [], runtimeContext) as Promise<unknown[]>,
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

  let { transform } = resolveConf;
  let data: unknown;

  try {
    data = await promise;
    // The fetched data and its inner objects should never be *injected* again.
    // recursiveMarkAsInjected(data);
  } catch (error) {
    if (isHandleRejectByTransform(onReject)) {
      transform = onReject.transform;
      data = error;
    } else {
      throw error;
    }
  }

  if (!transform) {
    return data;
  }

  // Keep backward compatibility of string transform.
  if (typeof transform === "string") {
    return { [transform]: data };
  }

  return asyncComputeRealValue(transform, { ...runtimeContext, data });
}

export function clearResolveCache() {
  cache.clear();
}

function isHandleRejectByTransform(
  onReject: HandleReject | undefined
): onReject is HandleRejectByTransform {
  return !!(onReject as HandleRejectByTransform).transform;
}
