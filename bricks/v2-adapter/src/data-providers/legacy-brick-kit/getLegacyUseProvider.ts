/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type React from "react";
import { isObject, isString } from "lodash";
import { fetchByProvider } from "@next-core/runtime";
import type { HttpOptions } from "@next-core/http";
import type {
  IncomingOptions,
  Req,
  Res,
  UseProviderArgs,
  UseProviderArgsDefaults,
  UseProviderArgsReturn,
  UseProviderArrayReturn,
  UseProviderCustomOptions,
  UseProviderError,
  UseProviderObjectReturn,
  UseProviderOptionArgsDefaults,
} from "./useProviderTypes.js";

const useProviderArgsDefaults: UseProviderArgsDefaults = {
  provider: "",
  customOptions: {
    onError: () => {
      /* Do nothing.. */
    },
    transform: (oldData: unknown, newData: unknown) => newData,
    data: undefined,
    loading: false,
    suspense: false,
    cache: true,
  },
  dependencies: undefined,
};

const defaults = Object.entries(useProviderArgsDefaults).reduce(
  (acc, [key, value]) => {
    if (Object.prototype.toString.call(value) === "[object Object]")
      return { ...acc, ...value };
    return { ...acc, [key]: value };
  },
  {} as UseProviderArgsDefaults
);

export function getLegacyUseProvider(LegacyReact: typeof React) {
  function useProvider<TData = unknown>(...args: UseProviderArgs) {
    const { provider, customOptions, dependencies, requestInit } =
      useProviderArgs(...args);
    const { onError, transform, suspense, cache, ...defaults } = customOptions;

    const [loading, setLoading] = LegacyReact.useState(defaults.loading);
    const suspenseStatus = LegacyReact.useRef<"pending" | "error" | "success">(
      "pending"
    );
    const suspender = LegacyReact.useRef<Promise<TData>>();
    const mounted = LegacyReact.useRef(false);
    const error = LegacyReact.useRef<UseProviderError>();
    const response = LegacyReact.useRef<Res<TData>>();
    const data = LegacyReact.useRef<TData | undefined>(defaults.data);
    const forceUpdate = LegacyReact.useReducer(() => ({}), [])[1];

    const doFetch = LegacyReact.useCallback(
      async (
        provider: string,
        ...args: unknown[]
      ): Promise<TData | undefined> => {
        try {
          error.current = undefined;
          if (!suspense) setLoading(true);
          const newRes = (await fetchByProvider(provider, args, {
            cache: cache ? "default" : "reload",
          })) as TData;
          response.current = newRes;
          data.current = transform(data.current, newRes);
        } catch (e: any) {
          error.current = e;
          data.current = undefined;
        }
        if (!suspense) setLoading(false);
        if (error.current) onError(error.current);
        return data.current;
      },
      [
        provider,
        customOptions,
        dependencies,
        requestInit,
        suspense,
        transform,
        defaults.data,
        onError,
        cache,
      ]
    );

    const makeFetch = LegacyReact.useCallback(
      async (
        providerOrBody: string | unknown[],
        args?: unknown[]
      ): Promise<TData | undefined> => {
        let providerStr = provider;
        let providerArgs = [] as unknown[];
        if (isString(providerOrBody)) {
          providerStr = providerOrBody;
        }
        if (isObject(providerOrBody)) {
          providerArgs = providerOrBody;
        } else if (isObject(args)) {
          providerArgs = args;
        }

        const actualArgs = [...providerArgs, requestInit.options];

        if (suspense) {
          return (async () => {
            suspender.current = doFetch(providerStr!, ...actualArgs).then(
              (newData) => {
                suspenseStatus.current = "success";
                return newData;
              },
              (error) => {
                suspenseStatus.current = "error";
                error.current = error;
                return error;
              }
            );
            forceUpdate();
            return await suspender.current;
          })();
        }
        return doFetch(providerStr!, ...actualArgs);
      },
      [doFetch]
    );

    const request: Req<TData> = LegacyReact.useMemo(
      () =>
        Object.defineProperties(
          {
            query: makeFetch,
          },
          {
            loading: {
              get() {
                return loading;
              },
            },
            data: {
              get() {
                return data.current;
              },
            },
            error: {
              get() {
                return error.current;
              },
            },
          }
        ),
      [makeFetch]
    ) as unknown as Req<TData>;

    // onMount/onUpdate
    LegacyReact.useEffect(() => {
      mounted.current = true;
      if (Array.isArray(dependencies) && provider) {
        request.query(provider, requestInit.args as unknown[]);
      }
      return () => {
        mounted.current = false;
      };
    }, dependencies);

    if (suspense && suspender.current) {
      switch (suspenseStatus.current) {
        case "pending":
          throw suspender.current;
        case "error":
          throw error.current;
      }
    }

    return Object.assign<
      UseProviderArrayReturn<TData | undefined>,
      UseProviderObjectReturn<TData | undefined>
    >([request, response.current, loading, error.current!], {
      request,
      ...request,
      response: response.current,
      data: data.current,
      loading,
      error: error.current,
    });
  }

  function useProviderArgs(
    providerOrParamsOrGlobalOptions?: string | IncomingOptions,
    globalOptionsOrDeps?: IncomingOptions | unknown[],
    deps?: unknown[]
  ): UseProviderArgsReturn {
    const provider = LegacyReact.useMemo(() => {
      if (typeof providerOrParamsOrGlobalOptions === "string") {
        return providerOrParamsOrGlobalOptions;
      }

      return useProviderArgsDefaults.provider;
    }, [providerOrParamsOrGlobalOptions, globalOptionsOrDeps]);

    const options = LegacyReact.useMemo(() => {
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

    const requestInit = LegacyReact.useMemo((): {
      args: unknown;
      options?: HttpOptions;
    } => {
      const customOptionKeys = [
        ...Object.keys(useProviderArgsDefaults),
        ...Object.keys(useProviderArgsDefaults.customOptions!),
      ] as Array<UseProviderOptionArgsDefaults>;

      const { args = null, ...restOptions } = (
        Object.keys(options) as any
      ).reduce(
        (acc: Record<string, unknown>, key: UseProviderOptionArgsDefaults) => {
          if (!customOptionKeys.includes(key))
            acc[key] = (options as never)[key];
          return acc;
        },
        {} as Record<string, unknown>
      );

      return { options: { ...restOptions }, args };
    }, [options]);

    const dependencies = LegacyReact.useMemo((): unknown[] | undefined => {
      if (Array.isArray(globalOptionsOrDeps)) return globalOptionsOrDeps;
      if (Array.isArray(deps)) return deps;
      return defaults.dependencies;
    }, [globalOptionsOrDeps, deps]);

    const loading = options.loading || Array.isArray(dependencies);

    const customOptions = LegacyReact.useMemo(() => {
      const customOptionKeys = Object.keys(
        useProviderArgsDefaults.customOptions!
      ) as (keyof UseProviderCustomOptions)[];

      const customOptions = customOptionKeys.reduce((opts, key) => {
        opts[key] = options[key];
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

  return useProvider;
}
