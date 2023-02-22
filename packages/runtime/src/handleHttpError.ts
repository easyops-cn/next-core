import {
  HttpFetchError,
  HttpResponseError,
  isHttpAbortError,
} from "@next-core/http";
import { getRuntime } from "./internal/Runtime.js";
import { getHistory } from "./history.js";

/**
 * 将 http 请求错误转换为可读的字符串。
 *
 * @remarks
 *
 * 将依次尝试读取返回的 JSON 格式数据的字符串类型的 `error` 和 `msg` 字段，如果没有找到则返回 `error.toString()` 的结果。
 *
 * @param error - 错误对象。
 *
 * @returns 转换为字符串的错误信息。
 */
export function httpErrorToString(error: unknown): string {
  if (error instanceof Event && error.target instanceof HTMLScriptElement) {
    return error.target.src;
  }
  if (error instanceof HttpFetchError) {
    // return i18next.t(`${NS_BRICK_KIT}:${K.NETWORK_ERROR}`);
    return "网络错误，请检查您的网络连接。";
  }
  if (error instanceof HttpResponseError) {
    if (error.responseJson) {
      if (typeof error.responseJson.error === "string") {
        return error.responseJson.error;
      } else if (typeof error.responseJson.msg === "string") {
        return error.responseJson.msg;
      }
    }
  }
  if (error == null) {
    return "Unknown error";
  }
  return error.toString();
}

export function isUnauthenticatedError(error: unknown): boolean {
  return (
    error instanceof HttpResponseError &&
    error.response.status === 401 &&
    !!error.responseJson &&
    error.responseJson.code === 100003
  );
}

let unauthenticatedConfirming = false;

/**
 * 处理 http 请求错误（使用 AntDesign 模态框弹出错误信息）。
 *
 * @param error - 错误对象。
 */
export function handleHttpError(error: unknown) {
  // Do nothing if aborted http requests
  if (isHttpAbortError(error)) {
    return;
  }

  // Redirect to login page if not logged in.
  if (isUnauthenticatedError(error) && !window.NO_AUTH_GUARD) {
    if (unauthenticatedConfirming) {
      return;
    }
    unauthenticatedConfirming = true;
    // i18next.t(`${NS_BRICK_KIT}:${K.LOGIN_TIMEOUT_MESSAGE}`)
    if (confirm("您还未登录或登录信息已过期，现在重新登录？")) {
      const ssoEnabled = getRuntime().getFeatureFlags()["sso-enabled"];
      const history = getHistory();
      history.push(ssoEnabled ? "/sso-auth/login" : "/auth/login", {
        from: {
          ...history.location,
          state: undefined,
        },
      });
    }
    setTimeout(() => {
      unauthenticatedConfirming = false;
    }, 1);
    return;
  }

  // eslint-disable-next-line no-console
  console.error(error);

  return alert(httpErrorToString(error));
}
