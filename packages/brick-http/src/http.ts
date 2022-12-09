import { fetch } from "./fetch";
import {
  HttpFetchError,
  HttpResponseError,
  HttpParseError,
  HttpAbortError,
} from "./errors";
import InterceptorManager from "./InterceptorManager";

export interface HttpRequestConfig {
  url?: string;
  method?: string;
  data?: any;
  meta?: Record<string, any>;
  options?: HttpOptions;
}
export interface ClearRequestCacheListConfig {
  uri?: string;
  method?: string;
}

export interface HttpResponse<T = any> {
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

function isNil(value: any): boolean {
  return value === undefined || value === null;
}

const base = document.querySelector("base");
const fullBaseHref = base ? base.href : location.origin + "/";

export type HttpParams =
  | URLSearchParams
  | {
      [key: string]: any;
    };

export interface RequestCustomOptions {
  observe?: "data" | "response";
  responseType?: "json" | "blob" | "arrayBuffer" | "text";
  interceptorParams?: any;
  noAbortOnRouteChange?: boolean;
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
  init?: RequestInit,
  config?: HttpRequestConfig
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
    } catch (e) {
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
    } catch (e) {
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

const getUrlWithParams = (url: string, params?: HttpParams): string => {
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
  data: any,
  headers: HeadersInit
): { body?: BodyInit; headers?: HeadersInit } => {
  if (data !== undefined) {
    // `new Headers(undefined)` will throw a TypeError in older browsers (chrome 58).
    // https://bugs.chromium.org/p/chromium/issues/detail?id=335871
    const parsedHeaders = new Headers(headers || {});
    const contentTypeHeader = "Content-Type";
    let body = data;
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

const simpleRequest = <T = any>(
  method: string,
  url: string,
  config: HttpRequestConfig
): Promise<HttpResponse<T>> => {
  const { params, responseType, interceptorParams, ...requestInit } =
    config.options || {};
  return request<T>(
    getUrlWithParams(url, params),
    {
      ...requestInit,
      method,
    },
    config
  );
};

const requestWithBody = <T = any>(
  method: string,
  url: string,
  data?: any,
  config?: HttpRequestConfig
): Promise<HttpResponse<T>> => {
  const { params, responseType, interceptorParams, headers, ...requestInit } =
    config.options || {};
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

class Http {
  private listener: Record<string, any> = {};
  private requestCache = new Map<string, Promise<any>>();

  private isEnableCache: boolean;
  private clearCacheIgnoreList: ClearRequestCacheListConfig[] = [];

  public enableCache = (enable: boolean): void => {
    this.isEnableCache = enable;
  };
  public setClearCacheIgnoreList = (
    list: ClearRequestCacheListConfig[]
  ): void => {
    this.clearCacheIgnoreList = list;
  };

  public on(action: string, fn: any): void {
    if (this.listener[action]) {
      this.listener[action].push(fn);
    } else {
      this.listener[action] = [fn];
    }
  }

  private emit(action: string, args: any): void {
    const listenList = this.listener[action];
    if (listenList) {
      let len = listenList.length;
      while (len--) {
        listenList[len](args);
      }
    }
  }

  public interceptors: {
    request: InterceptorManager<HttpRequestConfig>;
    response: InterceptorManager<HttpResponse>;
  };

  public defaults = {};

  constructor() {
    this.interceptors = {
      request: new InterceptorManager(),
      response: new InterceptorManager(),
    };
  }

  request = async <T>(
    url: string,
    init?: RequestInit,
    options?: RequestCustomOptions
  ): Promise<T> => {
    const { body, method, ...requestInit } = init || {};
    return this.fetch({
      ...this.defaults,
      url,
      data: body,
      method,
      options: { ...(options || {}), ...requestInit },
    });
  };

  simpleRequest = <T = any>(
    method: string,
    url: string,
    options: HttpOptions = {}
  ): Promise<T> => {
    return this.fetch({ ...this.defaults, url, method, options });
  };

  requestWithBody = <T = any>(
    method: string,
    url: string,
    data?: any,
    options: HttpOptions = {}
  ): Promise<T> => {
    return this.fetch({ ...this.defaults, url, method, data, options });
  };

  private dispatchRequest<T>(config: HttpRequestConfig): any {
    const { url, method, data, options = {} } = config;

    // "DELETE", "GET", "HEAD" methods.
    if (["DELETE", "GET", "HEAD"].includes(config.method)) {
      return simpleRequest<T>(method, url, config);
    }

    // "POST", "PUT" , "PATCH" methods.
    return requestWithBody<T>(method, url, data, config);
  }

  private fetch(config: HttpRequestConfig): Promise<any> {
    const chain: any[] = [];
    let key: string;
    if (this.isEnableCache) {
      try {
        key = `${config.method}.${config.url}.${
          config.data || config.options?.params
            ? JSON.stringify(config.data || config.options?.params)
            : ""
        }`;
      } catch {
        key = config.url;
      }
      if (this.requestCache.has(key)) {
        this.emit("match-api-cache", this.requestCache.size);
        return this.requestCache.get(key);
      }
    }
    let promise = Promise.resolve(config);

    this.interceptors.request.forEach((interceptor) => {
      chain.push(interceptor.fulfilled, interceptor.rejected);
    });

    chain.push(this.dispatchRequest, undefined);

    this.interceptors.response.forEach((interceptor) => {
      chain.push(interceptor.fulfilled, interceptor.rejected);
    });

    while (chain.length) {
      promise = promise.then(chain.shift(), chain.shift());
    }
    if (this.isEnableCache) {
      const shouldCache = this.clearCacheIgnoreList.some(
        (req) =>
          req.method === config.method &&
          (!req.uri || new RegExp(req.uri).test(config.url))
      );
      // 遇到 clearCacheIgnoreList 缓存列表外的，需要清除缓存
      if (shouldCache) {
        this.requestCache.set(key, promise);
        // 当请求发生异常，主动清理该缓存。
        promise.catch(() => {
          this.requestCache.delete(key);
        });
      } else {
        this.requestCache.clear();
      }
    }
    return promise;
  }

  getUrlWithParams(url: string, params?: HttpParams): string {
    return getUrlWithParams(url, params);
  }

  getBodyAndHeaders(
    data: any,
    headers: HeadersInit
  ): { body?: BodyInit; headers?: HeadersInit } {
    return getBodyAndHeaders(data, headers);
  }

  get<T>(url: string, options?: HttpOptions): Promise<T> {
    return this.fetch({ ...this.defaults, url, method: "GET", options });
  }

  delete<T>(url: string, options?: HttpOptions): Promise<T> {
    return this.fetch({ ...this.defaults, url, method: "DELETE", options });
  }

  head<T>(url: string, options?: HttpOptions): Promise<T> {
    return this.fetch({ ...this.defaults, url, method: "HEAD", options });
  }

  post<T>(url: string, data?: any, options?: HttpOptions): Promise<T> {
    return this.fetch({ ...this.defaults, url, method: "POST", data, options });
  }

  put<T>(url: string, data?: any, options?: HttpOptions): Promise<T> {
    return this.fetch({ ...this.defaults, url, method: "PUT", data, options });
  }

  patch<T>(url: string, data?: any, options?: HttpOptions): Promise<T> {
    return this.fetch({
      ...this.defaults,
      url,
      method: "PATCH",
      data,
      options,
    });
  }
}

export const http = new Http();
