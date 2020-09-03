import { fetch } from "./fetch";
import { HttpFetchError, HttpResponseError, HttpParseError } from "./errors";

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
  responseType?: "json" | "blob" | "arrayBuffer" | "text";
  interceptorParams?: any;
}

export type HttpCustomOptions = RequestCustomOptions & {
  params?: HttpParams;
};

export type HttpOptions = HttpCustomOptions & RequestInit;

const request = async <T>(
  url: string,
  init?: RequestInit,
  options: RequestCustomOptions = {}
): Promise<T> => {
  let response: Response;
  let { responseType, interceptorParams } = options;
  if (!responseType) {
    // Defaults to `json`
    responseType = "json";
  }
  try {
    response = await fetch(url, init, interceptorParams);
  } catch (e) {
    throw new HttpFetchError(e.toString());
  }

  if (!response.ok) {
    let responseJson;
    try {
      responseJson = await response.json();
    } catch (e) {
      // Do nothing.
    }
    throw new HttpResponseError(response, responseJson);
  }

  let result: T;
  try {
    result = await response[responseType]();
  } catch (e) {
    throw new HttpParseError(response);
  }
  return result;
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
    let body = data;
    if (typeof data === "string") {
      parsedHeaders.set("Content-Type", "application/x-www-form-urlencoded");
    } else if (data instanceof FormData) {
      // Do nothing
    } else {
      parsedHeaders.set("Content-Type", "application/json");
      body = JSON.stringify(data);
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
  options: HttpOptions = {}
): Promise<T> => {
  const { params, responseType, interceptorParams, ...requestInit } = options;
  return request<T>(
    getUrlWithParams(url, params),
    {
      ...requestInit,
      method,
    },
    {
      responseType,
      interceptorParams,
    }
  );
};

const requestWithBody = <T = any>(
  method: string,
  url: string,
  data?: any,
  options: HttpOptions = {}
): Promise<T> => {
  const {
    params,
    responseType,
    interceptorParams,
    headers,
    ...requestInit
  } = options;
  return request<T>(
    getUrlWithParams(url, params),
    {
      ...requestInit,
      method,
      ...getBodyAndHeaders(data, headers),
    },
    {
      responseType,
      interceptorParams,
    }
  );
};

const get = <T = any>(url: string, options?: HttpOptions): Promise<T> =>
  simpleRequest<T>("GET", url, options);

const post = <T = any>(
  url: string,
  data?: any,
  options?: HttpOptions
): Promise<T> => requestWithBody<T>("POST", url, data, options);

const put = <T = any>(
  url: string,
  data?: any,
  options?: HttpOptions
): Promise<T> => requestWithBody<T>("PUT", url, data, options);

const patch = <T = any>(
  url: string,
  data?: any,
  options?: HttpOptions
): Promise<T> => requestWithBody<T>("PATCH", url, data, options);

const httpDelete = <T = any>(url: string, options?: HttpOptions): Promise<T> =>
  simpleRequest<T>("DELETE", url, options);

const head = <T = any>(url: string, options?: HttpOptions): Promise<T> =>
  simpleRequest<T>("HEAD", url, options);

export const http = {
  get,
  post,
  put,
  patch,
  delete: httpDelete,
  head,
  request,
  getBodyAndHeaders,
  getUrlWithParams,
  requestWithBody,
  simpleRequest,
};
