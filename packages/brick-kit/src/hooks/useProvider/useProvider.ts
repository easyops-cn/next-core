import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import useProviderArgs from "./useProviderArgs";
import {
  UseProviderArgs,
  FetchArgs,
  UseProviderError,
  UseProviderObjectReturn,
  Req,
  Res,
  UseProviderArrayReturn,
  UseProvider,
} from "./useProviderTypes";
import { isObject, isString } from "lodash";
import fetchProviderArgs from "./fetchProviderArgs";
import fetch from "./fetch";

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
  const error = useRef<UseProviderError>();
  const response = useRef<Res<TData>>();
  const data = useRef<TData>(defaults.data);
  const forceUpdate = useReducer(() => ({}), [])[1];

  const doFetch = useCallback(
    async (provider: string, ...args: FetchArgs): Promise<TData> => {
      try {
        error.current = undefined;
        if (!suspense) setLoading(true);
        const newRes = (await fetch(provider, cache, ...args)) as TData;
        response.current = newRes;
        data.current = transform(data.current, newRes);
      } catch (e) {
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

  const makeFetch = useCallback(
    async (
      providerOrBody: string | unknown[],
      args?: unknown[]
    ): Promise<TData> => {
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

      const actualArgs = await fetchProviderArgs(
        providerStr,
        providerArgs,
        requestInit.options
      );

      if (suspense) {
        return (async () => {
          suspender.current = doFetch(providerStr, ...actualArgs).then(
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
      return doFetch(providerStr, ...actualArgs);
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
            get(): TData {
              return data.current;
            },
          },
          error: {
            get(): UseProviderError {
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
