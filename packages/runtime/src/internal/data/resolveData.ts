import type {
  HandleReject,
  HandleRejectByTransform,
  ResolveConf,
} from "@next-core/types";
import { asyncComputeRealValue } from "../compute/computeRealValue.js";
import { getProviderBrick } from "./getProviderBrick.js";
import type { RuntimeContext } from "../interfaces.js";
import { _internalApiGetRenderId, hooks } from "../Runtime.js";
import { markAsComputed } from "../compute/markAsComputed.js";
import { get } from "lodash";
import { isStrictMode, warnAboutStrictMode } from "../../isStrictMode.js";

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
  renderId?: string;
}

export async function resolveData(
  resolveConf: ResolveConf,
  runtimeContext: RuntimeContext,
  options?: ResolveOptions
) {
  const { useProvider, method = "resolve", args = [], onReject } = resolveConf;

  const { provider: legacyProvider, field: legacyField } = resolveConf as {
    provider?: string;
    field?: string | string[];
  };
  if (legacyProvider && !useProvider) {
    throw new Error(
      `You're using "provider: ${legacyProvider}" which is dropped in v3, please use "useProvider" instead`
    );
  }

  const hasLegacyField = legacyField !== null && legacyField !== undefined;
  if (hasLegacyField) {
    const strict = isStrictMode();
    warnAboutStrictMode(strict, "`resolve.field`");
    // istanbul ignore next
    if (strict) {
      throw new Error("Using deprecated `resolve.field`");
    }
  }

  const [providerBrick, actualArgs] = await Promise.all([
    getProviderBrick(useProvider) as unknown as Promise<
      Record<string, Function>
    >,
    asyncComputeRealValue(args, runtimeContext) as Promise<unknown[]>,
  ]);

  // `clearResolveCache` maybe cleared during the above promise being
  // fulfilled, so we manually mark it as stale for this case.
  const renderId = options?.renderId;
  const stale = !!renderId && renderId !== _internalApiGetRenderId();

  const promise = resolveByProvider(
    providerBrick,
    useProvider,
    method,
    actualArgs,
    options,
    args,
    stale
  );

  let { transform } = resolveConf;
  let data: unknown;

  try {
    const value = await promise;
    data = hasLegacyField ? get(value, legacyField) : value;
    // The fetched data and its inner objects should never be *injected* again.
    markAsComputed(data);
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
  originalArgs?: unknown[],
  stale?: boolean
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
      const finalArgs = hooks?.flowApi?.isFlowApiProvider(useProvider)
        ? await hooks.flowApi.getArgsOfFlowApi(useProvider, args, method)
        : args;
      return brick[method](...finalArgs);
    })();

    if (!stale) {
      cache.set(cacheKey, promise);
    }
  }

  return promise;
}

function isHandleRejectByTransform(
  onReject: HandleReject | undefined
): onReject is HandleRejectByTransform {
  return !!(onReject as HandleRejectByTransform)?.transform;
}
