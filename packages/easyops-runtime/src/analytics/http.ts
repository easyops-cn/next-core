import {
  HttpResponseError,
  HttpParseError,
  HttpAbortError,
  type HttpError,
  type HttpRequestConfig,
  type HttpResponse,
} from "@next-core/http";
import { isObject } from "@next-core/utils/general";
import { getAuth } from "../auth.js";
import type { HttpAnalyticsMeta } from "./interfaces.js";
import { pushApiMetric } from "./analytics.js";

const symbolHttpAnalytics = Symbol("HttpAnalytics");

interface HttpRequestConfigWithAnalyticsMeta extends HttpRequestConfig {
  [symbolHttpAnalytics]?: HttpAnalyticsMeta;
}

export function onRequest(
  config: HttpRequestConfigWithAnalyticsMeta
): HttpRequestConfig {
  const perfStartTime = Math.round(performance.now());
  const st = Date.now();
  config[symbolHttpAnalytics] = {
    st,
    time: Math.round(st / 1000),
    perfStartTime,
  };
  return config;
}

export function onResponse(
  response: HttpResponse,
  config: HttpRequestConfigWithAnalyticsMeta
): HttpResponse {
  return onResponseOrError(false, response, config);
}

export function onResponseError(
  error: HttpError,
  config: HttpRequestConfigWithAnalyticsMeta
): Promise<HttpError> {
  return onResponseOrError(true, error, config);
}

function onResponseOrError(
  hasError: false,
  response: HttpResponse,
  config: HttpRequestConfigWithAnalyticsMeta
): HttpResponse;
function onResponseOrError(
  hasError: true,
  error: HttpError,
  config: HttpRequestConfigWithAnalyticsMeta
): Promise<HttpError>;
function onResponseOrError(
  hasError: boolean,
  responseOrError: HttpResponse | HttpError,
  config: HttpRequestConfigWithAnalyticsMeta
): HttpResponse | Promise<HttpError> {
  const perfEndTime = Math.round(performance.now());
  const et = Date.now();
  const { [symbolHttpAnalytics]: meta, url } = config;
  if (meta && !(hasError && responseOrError instanceof HttpAbortError)) {
    delete config[symbolHttpAnalytics];
    const { st, time, perfStartTime } = meta;
    const { userInstanceId: uid, username } = getAuth();

    let code: number | undefined;
    let message: string | undefined;
    let traceId: string | null | undefined;
    let size: string | null | undefined;
    let status: number | undefined;

    let headers: Headers | undefined;
    let data: unknown;

    if (hasError) {
      const isHttpResponseError = responseOrError instanceof HttpResponseError;
      if (isHttpResponseError || responseOrError instanceof HttpParseError) {
        ({ status, headers } = responseOrError.response);
        if (isHttpResponseError) {
          data = responseOrError.responseJson;
        }
      }
    } else {
      ({ status, data, headers } = responseOrError as HttpResponse);
    }

    if (isObject(data)) {
      ({ code, message } = data as { code?: number; message?: string });
    }

    if (headers instanceof Headers) {
      traceId = headers.get("x-b3-traceid");
      size = headers.get("content-length");
    }

    pushApiMetric({
      st,
      _ver: st,
      uid,
      username,
      time,
      et,
      page: location.href,
      duration: perfEndTime - perfStartTime,
      api: url,
      type: "api",
      code: code ?? -1,
      msg: message ?? "",
      status,
      traceId: traceId ?? "",
      size: size ? Number(size) : -1,
    });
  }

  return hasError
    ? Promise.reject(responseOrError)
    : (responseOrError as HttpResponse);
}
