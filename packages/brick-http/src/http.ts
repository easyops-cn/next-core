import { fetch } from "./fetch.js";
import {
  HttpAbortError,
  HttpFetchError,
  HttpParseError,
  HttpResponseError,
} from "./errors.js";
import InterceptorManager from "./InterceptorManager.js";

export interface HttpRequestConfig {
  url: string;
  method: string;
  data?: unknown;
  meta?: unknown;
  options?: HttpOptions;
}

export interface HttpResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
  config: HttpRequestConfig;
}

export interface HttpError {
  config: HttpRequestConfig;
  error: HttpFetchError | HttpResponseError | HttpParseError | HttpAbortError;
}

export interface HttpAdapter {
  (config: HttpRequestConfig): Promise<HttpResponse<unknown>>;
}

export interface HttpConstructorOptions {
  adapter?: HttpAdapter;
}

// type NotNil<T> = T extends null ? never : T;

function isNil(value: unknown): value is null | undefined {
  return value === undefined || value === null;
}

const base = document.querySelector("base");
const fullBaseHref = base ? base.href : location.origin + "/";

export type HttpParams =
  | URLSearchParams
  | {
      [key: string]: string | string[] | null | undefined;
    };

export interface RequestCustomOptions {
  observe?: "data" | "response";
  responseType?: "json" | "blob" | "arrayBuffer" | "text";
  interceptorParams?: {
    ignoreLoadingBar?: boolean;
  };
  noAbortOnRouteChange?: boolean;
  useCache?: boolean;
}

export type HttpCustomOptions = RequestCustomOptions & {
  params?: HttpParams;
};

export type HttpOptions = HttpCustomOptions & RequestInit;

// https://developer.mozilla.org/en-US/docs/Web/API/DOMException
export const isHttpAbortError = (error: any) =>
  error instanceof DOMException && error.code === 20;

const createError = (
  error: HttpFetchError | HttpResponseError | HttpParseError | HttpAbortError,
  config: HttpRequestConfig
): HttpError => {
  return {
    error,
    config,
  };
};

const request = async <T>(
  url: string,
  init: RequestInit,
  config: HttpRequestConfig
): Promise<HttpResponse<T>> => {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve, reject) => {
    let response: Response;
    config.url = url;

    let { responseType } = config.options || {};

    if (!responseType) {
      // Defaults to `json`
      responseType = "json";
    }

    try {
      response = await fetch(url, init);
    } catch (e: any) {
      reject(
        createError(
          isHttpAbortError(e)
            ? new HttpAbortError(e.toString())
            : new HttpFetchError(e.toString()),
          config
        )
      );
      return;
    }

    if (!response.ok) {
      let responseJson;
      try {
        responseJson = await response.json();
      } catch (e) {
        // Do nothing.
      }
      reject(
        createError(new HttpResponseError(response, responseJson), config)
      );
      return;
    }

    let data: T;
    try {
      data = await response[responseType]();
    } catch (e: any) {
      reject(
        createError(
          isHttpAbortError(e)
            ? new HttpAbortError(e.toString())
            : new HttpParseError(response),
          config
        )
      );
      return;
    }

    const res: HttpResponse<T> = {
      config,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data,
    };

    resolve(res);
  });
};

export const getUrlWithParams = (url: string, params?: HttpParams): string => {
  if (params) {
    const parsedUrl = new URL(url, fullBaseHref);
    if (params instanceof URLSearchParams) {
      params.forEach(function (value, key) {
        parsedUrl.searchParams.append(key, value);
      });
    } else {
      Object.entries(params).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach((v) => {
            parsedUrl.searchParams.append(key, isNil(v) ? "" : v);
          });
        } else {
          parsedUrl.searchParams.append(key, isNil(value) ? "" : value);
        }
      });
    }
    const { href } = parsedUrl;
    if (href.startsWith(fullBaseHref)) {
      return href.substr(fullBaseHref.length);
    }
    return href;
  }
  return url;
};

const getBodyAndHeaders = (
  data: unknown,
  headers?: HeadersInit
): { body?: BodyInit; headers?: HeadersInit } => {
  if (data !== undefined) {
    // `new Headers(undefined)` will throw a TypeError in older browsers (chrome 58).
    // https://bugs.chromium.org/p/chromium/issues/detail?id=335871
    const parsedHeaders = new Headers(headers || {});
    const contentTypeHeader = "Content-Type";
    let body = data as BodyInit | undefined;
    // If `Content-Type` already provided, ignore detecting content type.
    if (!parsedHeaders.has(contentTypeHeader)) {
      if (typeof data === "string") {
        parsedHeaders.set(
          contentTypeHeader,
          "application/x-www-form-urlencoded"
        );
      } else if (data instanceof FormData) {
        // Do nothing
      } else {
        parsedHeaders.set(contentTypeHeader, "application/json");
        body = JSON.stringify(data);
      }
    }
    return {
      body,
      headers: parsedHeaders,
    };
  }
  return { headers };
};

const simpleRequest = <T = unknown>(
  method: string,
  url: string,
  config: HttpRequestConfig
): Promise<HttpResponse<T>> => {
  const {
    params,
    responseType,
    interceptorParams,
    observe,
    noAbortOnRouteChange,
    useCache,
    ...requestInit
  } = config.options || {};
  return request<T>(
    getUrlWithParams(url, params),
    {
      ...requestInit,
      method,
    },
    config
  );
};

const requestWithBody = <T = unknown>(
  method: string,
  url: string,
  data: unknown,
  config: HttpRequestConfig
): Promise<HttpResponse<T>> => {
  const {
    params,
    responseType,
    interceptorParams,
    observe,
    noAbortOnRouteChange,
    useCache,
    headers,
    ...requestInit
  } = config.options || {};
  return request<T>(
    getUrlWithParams(url, params),
    {
      ...requestInit,
      method,
      ...getBodyAndHeaders(data, headers),
    },
    config
  );
};

const defaultAdapter: HttpAdapter = <T>(config: HttpRequestConfig) => {
  const { url, method, data } = config;

  // "DELETE", "GET", "HEAD" methods.
  if (["DELETE", "GET", "HEAD"].includes(config.method)) {
    return simpleRequest<T>(method, url, config);
  }

  // "POST", "PUT" , "PATCH" methods.
  return requestWithBody<T>(method, url, data, config);
};

class Http {
  public readonly interceptors: {
    request: InterceptorManager<HttpRequestConfig>;
    response: InterceptorManager<HttpResponse>;
  };

  #adapter: HttpAdapter = defaultAdapter;

  constructor(config?: HttpConstructorOptions) {
    this.interceptors = {
      request: new InterceptorManager(),
      response: new InterceptorManager(),
    };

    if (config?.adapter) {
      this.#adapter = config.adapter;
    }
  }

  request = async <T = unknown>(
    url: string,
    init?: RequestInit,
    options?: RequestCustomOptions
  ): Promise<T> => {
    const { body, method, ...requestInit } = init || {};
    return this.#fetch<T>({
      url,
      data: body,
      method: method || "GET",
      options: { ...(options || {}), ...requestInit },
    });
  };

  simpleRequest = <T = unknown>(
    method: string,
    url: string,
    options: HttpOptions = {}
  ): Promise<T> => {
    return this.#fetch<T>({ url, method, options });
  };

  requestWithBody = <T = unknown>(
    method: string,
    url: string,
    data?: unknown,
    options: HttpOptions = {}
  ): Promise<T> => {
    return this.#fetch<T>({ url, method, data, options });
  };

  #fetch<T>(config: HttpRequestConfig): Promise<T> {
    const chain: any[] = [];
    let promise: Promise<any> = Promise.resolve(config);

    this.interceptors.request.forEach((interceptor) => {
      chain.push(interceptor.fulfilled, interceptor.rejected);
    });

    chain.push((config: HttpRequestConfig) => this.#adapter(config), undefined);

    this.interceptors.response.forEach((interceptor) => {
      chain.push(interceptor.fulfilled, interceptor.rejected);
    });

    chain.push(
      (response: HttpResponse) => {
        return response.config.options?.observe === "response"
          ? response
          : response.data;
      },
      (error: HttpError) => {
        return Promise.reject(error.error);
      }
    );

    while (chain.length) {
      promise = promise.then(chain.shift(), chain.shift());
    }

    return promise;
  }

  getUrlWithParams(url: string, params?: HttpParams): string {
    return getUrlWithParams(url, params);
  }

  getBodyAndHeaders(
    data: unknown,
    headers: HeadersInit
  ): { body?: BodyInit; headers?: HeadersInit } {
    return getBodyAndHeaders(data, headers);
  }

  get<T>(url: string, options?: HttpOptions): Promise<T> {
    return this.#fetch({ url, method: "GET", options });
  }

  delete<T>(url: string, options?: HttpOptions): Promise<T> {
    return this.#fetch({ url, method: "DELETE", options });
  }

  head<T>(url: string, options?: HttpOptions): Promise<T> {
    return this.#fetch({ url, method: "HEAD", options });
  }

  post<T>(url: string, data?: unknown, options?: HttpOptions): Promise<T> {
    return this.#fetch({ url, method: "POST", data, options });
  }

  put<T>(url: string, data?: unknown, options?: HttpOptions): Promise<T> {
    return this.#fetch({ url, method: "PUT", data, options });
  }

  patch<T>(url: string, data?: unknown, options?: HttpOptions): Promise<T> {
    return this.#fetch({
      url,
      method: "PATCH",
      data,
      options,
    });
  }
}

let http = new Http();
function createHttpInstance(config?: HttpConstructorOptions): void {
  http = new Http(config);
}
export { http, createHttpInstance, defaultAdapter };
