import { useMemo } from "react";
import defaults, {
  useProviderArgsDefaults,
} from "./useProviderArgsDefaults.js";
import { isObject } from "lodash";
import { HttpOptions } from "@next-core/http";
import type {
  IncomingOptions,
  UseProviderArgsReturn,
  UseProviderCustomOptions,
  UseProviderOptionArgsDefaults,
} from "./useProviderTypes.js";

export default function useProviderArgs(
  providerOrParamsOrGlobalOptions?: string | IncomingOptions,
  globalOptionsOrDeps?: IncomingOptions | any[],
  deps?: any[]
): UseProviderArgsReturn {
  const provider = useMemo(() => {
    if (typeof providerOrParamsOrGlobalOptions === "string") {
      return providerOrParamsOrGlobalOptions;
    }

    return useProviderArgsDefaults.provider as string;
  }, [providerOrParamsOrGlobalOptions, globalOptionsOrDeps]);

  const options = useMemo(() => {
    let localOptions = {};
    if (isObject(providerOrParamsOrGlobalOptions)) {
      localOptions = providerOrParamsOrGlobalOptions;
    } else if (isObject(globalOptionsOrDeps)) {
      localOptions = globalOptionsOrDeps;
    }
    return {
      ...defaults,
      ...localOptions,
    } as IncomingOptions;
  }, [providerOrParamsOrGlobalOptions, globalOptionsOrDeps]);

  const requestInit = useMemo((): {
    args: unknown;
    options?: HttpOptions;
  } => {
    const customOptionKeys = [
      ...Object.keys(useProviderArgsDefaults),
      ...Object.keys(
        useProviderArgsDefaults.customOptions as Partial<
          UseProviderCustomOptions<any>
        >
      ),
    ] as Array<UseProviderOptionArgsDefaults>;

    const { args = null, ...restOptions } = (
      Object.keys(options) as any
    ).reduce(
      (acc: Record<string, any>, key: UseProviderOptionArgsDefaults) => {
        if (!customOptionKeys.includes(key)) acc[key] = (options as never)[key];
        return acc;
      },
      {} as Record<string, any>
    );

    return { options: { ...restOptions }, args };
  }, [options]);

  const dependencies = useMemo((): any[] | undefined => {
    if (Array.isArray(globalOptionsOrDeps)) return globalOptionsOrDeps;
    if (Array.isArray(deps)) return deps;
    return defaults.dependencies;
  }, [globalOptionsOrDeps, deps]);

  const loading = options.loading || Array.isArray(dependencies);

  const customOptions = useMemo(() => {
    const customOptionKeys = Object.keys(
      useProviderArgsDefaults.customOptions as Partial<
        UseProviderCustomOptions<any>
      >
    ) as (keyof UseProviderCustomOptions)[];

    const customOptions = customOptionKeys.reduce((opts, key) => {
      (opts as any)[key] = options[key];
      return opts;
    }, {} as UseProviderCustomOptions);

    return { ...customOptions, loading };
  }, [options]);

  return {
    provider,
    customOptions,
    requestInit,
    dependencies,
  };
}
