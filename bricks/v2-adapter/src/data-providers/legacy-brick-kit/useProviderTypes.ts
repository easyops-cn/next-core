import {
  HttpFetchError,
  HttpOptions,
  HttpParseError,
  HttpResponseError,
} from "@next-core/http";

export type UseProviderError =
  | Error
  | HttpFetchError
  | HttpResponseError
  | HttpParseError;

export type OnError = (error: UseProviderError) => void;

export interface UseProviderCustomOptions<TData = any> {
  loading: boolean;
  onError: OnError;
  transform: (currData: TData, newData: TData) => any;
  suspense: boolean;
  data: TData;
  cache: boolean;
}

export type UseProviderArgsReturn = {
  provider?: string;
  customOptions: UseProviderCustomOptions;
  dependencies?: any[];
  requestInit: Partial<{
    args: unknown;
    options: HttpOptions;
  }>;
};

export interface UseProviderArgsDefaults {
  provider?: string;
  customOptions?: Partial<UseProviderCustomOptions>;
  dependencies?: any[];
}

export interface ReqBase<TData> {
  data: TData | undefined;
  loading: boolean;
  error: Error | undefined;
}

export type RequestInit = Partial<Omit<HttpOptions, "body" | "cache">> & {
  args?: unknown[];
};

export type IncomingOptions = Partial<UseProviderCustomOptions> & RequestInit;

export type UseProviderArgs = [
  (string | IncomingOptions)?,
  (IncomingOptions | any[])?,
  any[]?
];

export type UseProviderOptionArgsDefaults = keyof UseProviderCustomOptions &
  keyof Omit<UseProviderArgsDefaults, "customOptions">;

export type useProviderQueryMethod<TData> = (
  providerOrArgs: string | unknown[],
  args?: unknown[]
) => Promise<TData>;

export type Req<TData = any> = {
  query: useProviderQueryMethod<TData>;
} & ReqBase<TData>;

export type Res<TData = any> = TData;

export type UseProviderArrayReturn<TData> = [
  Req<TData>,
  Res<TData>,
  boolean,
  UseProviderError
];

export type UseProviderObjectReturn<TData> = ReqBase<TData> & {
  query: useProviderQueryMethod<TData>;
  request: Req<TData>;
  response: Res<TData>;
};

export type UseProvider<TData> = UseProviderArrayReturn<TData> &
  UseProviderObjectReturn<TData>;
