import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import useProviderArgs from "./useProviderArgs.js";
import type {
  UseProviderArgs,
  FetchArgs,
  UseProviderError,
  UseProviderObjectReturn,
  Req,
  Res,
  UseProviderArrayReturn,
  UseProvider,
} from "./useProviderTypes.js";
import { isObject, isString } from "lodash";
import fetch from "./fetch.js";

export function useProvider<TData = any>(
  ...args: UseProviderArgs
): UseProvider<TData> {
  const { provider, customOptions, dependencies, requestInit } =
    useProviderArgs(...args);
  const { onError, transform, suspense, cache, ...defaults } = customOptions;

  const [loading, setLoading] = useState(defaults.loading);
  const suspenseStatus = useRef<"pending" | "error" | "success">("pending");
  const suspender = useRef<Promise<any>>();
  const mounted = useRef(false);
  const error = useRef<UseProviderError | undefined>();
  const response = useRef<Res<TData>>();
  const data = useRef<TData | undefined>(defaults.data);
  const forceUpdate = useReducer(() => ({}), [])[1];

  const doFetch = useCallback(
    async (
      provider: string,
      providerArgs: FetchArgs
    ): Promise<TData | undefined> => {
      try {
        error.current = undefined;
        if (!suspense) setLoading(true);
        const newRes = (await fetch(provider, cache, providerArgs)) as TData;
        response.current = newRes;
        data.current = transform(data.current, newRes);
      } catch (e) {
        error.current = e as UseProviderError;
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

  const makeFetch = useCallback(
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

      if (suspense) {
        return (async () => {
          suspender.current = doFetch(providerStr, providerArgs).then(
            (newData) => {
              suspenseStatus.current = "success";
              return newData;
            },
            (error) => {
              /* istanbul ignore next */
              suspenseStatus.current = "error";
              error.current = error;
              return error;
            }
          );
          forceUpdate();
          return await suspender.current;
        })();
      }
      return doFetch(providerStr, providerArgs);
    },
    [doFetch]
  );

  const request: Req<TData> = useMemo(
    () =>
      Object.defineProperties(
        {
          query: makeFetch,
        },
        {
          loading: {
            get(): boolean {
              return loading;
            },
          },
          data: {
            get(): TData | undefined {
              return data.current;
            },
          },
          error: {
            get(): UseProviderError | undefined {
              return error.current;
            },
          },
        }
      ),
    [makeFetch]
  ) as unknown as Req<TData>;

  // onMount/onUpdate
  useEffect((): any => {
    mounted.current = true;
    if (Array.isArray(dependencies) && provider) {
      request.query(provider, requestInit.args as unknown[]);
    }
    return () => (mounted.current = false);
  }, dependencies);

  if (suspense && suspender.current) {
    switch (suspenseStatus.current) {
      case "pending":
        throw suspender.current;
      /* istanbul ignore next */
      case "error":
        throw error.current;
    }
  }

  return Object.assign<
    UseProviderArrayReturn<TData>,
    UseProviderObjectReturn<TData>
  >([request, response.current, loading, error.current], {
    request,
    ...request,
    response: response.current,
    data: data.current,
    loading,
    error: error.current,
  });
}
