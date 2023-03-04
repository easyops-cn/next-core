import type {
  HandleReject,
  HandleRejectByTransform,
  ResolveConf,
} from "@next-core/types";
import { asyncComputeRealValue } from "../compute/computeRealValue.js";
import { getProviderBrick } from "./getProviderBrick.js";
import type { RuntimeContext } from "../interfaces.js";
import { getArgsOfFlowApi } from "./FlowApi.js";

const cache = new Map<string, Promise<unknown>>();

export interface ResolveOptions {
  /**
   * Cache mode of resolve.
   *
   * See https://developer.mozilla.org/en-US/docs/Web/API/Request/cache
   *
   * - `default`: Looks for a matching cache.
   * - `reload`: Without looking for a matching cache.
   */
  cache?: "default" | "reload";
}

export async function resolveData(
  resolveConf: ResolveConf,
  runtimeContext: RuntimeContext,
  options?: ResolveOptions
) {
  const { useProvider, method = "resolve", args = [], onReject } = resolveConf;

  const legacyProvider = (resolveConf as { provider?: string }).provider;
  if (legacyProvider && !useProvider) {
    throw new Error(
      `You're using "provider: ${legacyProvider}" which is not supported in v3, please use "useProvider" instead`
    );
  }

  const [providerBrick, actualArgs] = await Promise.all([
    getProviderBrick(
      useProvider,
      runtimeContext.brickPackages
    ) as unknown as Promise<Record<string, Function>>,
    asyncComputeRealValue(args, runtimeContext) as Promise<unknown[]>,
  ]);

  const promise = resolveByProvider(
    providerBrick,
    useProvider,
    method,
    actualArgs,
    options,
    args
  );

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

export async function resolveByProvider(
  brick: Record<string, Function>,
  useProvider: string,
  method: string,
  args: unknown[],
  options?: ResolveOptions,
  originalArgs?: unknown[]
) {
  let cacheKey: string;
  try {
    // `args` may contain circular references, which makes
    // JSON stringify failed, thus we fallback to original args.
    cacheKey = JSON.stringify({
      useProvider,
      method,
      args,
    });
  } catch (e) {
    if (!originalArgs) {
      throw e;
    }
    cacheKey = JSON.stringify({
      useProvider,
      method,
      originalArgs,
    });
  }

  let promise: Promise<unknown> | undefined;
  if (options?.cache !== "reload") {
    promise = cache.get(cacheKey);
  }
  if (!promise) {
    promise = (async () => {
      const finalArgs = await getArgsOfFlowApi(useProvider, args, method);
      return brick.resolve(...finalArgs);
    })();

    cache.set(cacheKey, promise);
  }

  return promise;
}

function isHandleRejectByTransform(
  onReject: HandleReject | undefined
): onReject is HandleRejectByTransform {
  return !!(onReject as HandleRejectByTransform)?.transform;
}
