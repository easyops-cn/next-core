import {
  HttpResponseError,
  HttpParseError,
  HttpFetchError,
} from "@easyops/brick-http";
import { Modal } from "antd";
import { ModalFunc } from "antd/lib/modal/confirm";
import i18next from "i18next";
import { K, NS_BRICK_KIT } from "./i18n/constants";
import { getHistory } from "./history";
import { isUnauthenticatedError } from "./isUnauthenticatedError";

/**
 * 将 http 请求错误转换为可读的字符串。
 *
 * @remarks
 *
 * 将依次尝试读取返回的 JSON 格式数据的字符串类型的 `error` 和 `msg` 字段，如果没有找到则返回 `error.toString()` 的结果。
 *
 * @param error 错误对象。
 *
 * @returns 转换为字符串的错误信息。
 */
export const httpErrorToString = (
  error: Error | HttpFetchError | HttpResponseError | HttpParseError | Event
): string => {
  if (error instanceof Event && error.target instanceof HTMLScriptElement) {
    return error.target.src;
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
  return error.toString();
};

/**
 * 处理 http 请求错误（使用 AntDesign 模态框弹出错误信息）。
 *
 * @param error 错误对象。
 */
export const handleHttpError = (
  error: Error | HttpFetchError | HttpResponseError | HttpParseError
): ReturnType<ModalFunc> => {
  // Redirect to login page if not logged in.
  if (isUnauthenticatedError(error)) {
    const history = getHistory();
    history.push("/auth/login", {
      from: {
        ...history.location,
        state: undefined,
      },
    });
    return;
  }

  return Modal.error({
    title: i18next.t(`${NS_BRICK_KIT}:${K.REQUEST_FAILED}`),
    content: httpErrorToString(error),
    okText: i18next.t(`${NS_BRICK_KIT}:${K.MODAL_OK}`),
  });
};
