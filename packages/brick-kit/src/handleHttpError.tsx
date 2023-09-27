import React from "react";
import {
  HttpResponseError,
  HttpParseError,
  HttpFetchError,
  HttpAbortError,
} from "@next-core/brick-http";
import { Modal } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import { ModalFunc } from "antd/lib/modal/confirm";
import i18next from "i18next";
import { K, NS_BRICK_KIT } from "./i18n/constants";
import { getHistory } from "./history";
import { isUnauthenticatedError } from "./internal/isUnauthenticatedError";
import { getRuntime } from "./runtime";
import { isHttpAbortError } from "./internal/isHttpAbortError";
import { setLoginStateCookie } from "./setLoginStateCookie";

interface ErrorIllustrationConf {
  title: string;
  showBackLink?: boolean;
  illustration?: {
    name: string;
    category: string;
  };
}

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
export function httpErrorToString(
  error: Error | HttpFetchError | HttpResponseError | HttpParseError | Event
): string {
  if (error instanceof Event && error.target instanceof HTMLScriptElement) {
    return error.target.src;
  }
  if (error instanceof HttpFetchError) {
    return i18next.t(`${NS_BRICK_KIT}:${K.NETWORK_ERROR}`);
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
}

let unauthenticatedConfirmModal: ReturnType<ModalFunc>;

/**
 * 处理 http 请求错误（使用 AntDesign 模态框弹出错误信息）。
 *
 * @param error - 错误对象。
 */
export function handleHttpError(
  error:
    | Error
    | HttpFetchError
    | HttpResponseError
    | HttpParseError
    | HttpAbortError
): ReturnType<ModalFunc> {
  // Do nothing if aborted http requests
  if (isHttpAbortError(error)) {
    return;
  }
  // Redirect to login page if not logged in.
  if (isUnauthenticatedError(error) && !window.NO_AUTH_GUARD) {
    // Do not show multiple confirm modals.
    if (unauthenticatedConfirmModal) {
      return;
    }
    unauthenticatedConfirmModal = Modal.confirm({
      icon: <ExclamationCircleOutlined />,
      content: <LoginTimeoutMessage />,
      okText: i18next.t(`${NS_BRICK_KIT}:${K.MODAL_OK}`),
      cancelText: i18next.t(`${NS_BRICK_KIT}:${K.MODAL_CANCEL}`),
      onOk: () => {
        const ssoEnabled = getRuntime().getFeatureFlags()["sso-enabled"];
        const history = getHistory();
        setLoginStateCookie(history.location);
        history.push(ssoEnabled ? "/sso-auth/login" : "/auth/login", {
          from: {
            ...history.location,
            state: undefined,
          },
        });
      },
    });
    return;
  }

  return Modal.error({
    title: i18next.t(`${NS_BRICK_KIT}:${K.REQUEST_FAILED}`),
    content: (
      <div
        style={{
          whiteSpace: "pre-wrap",
        }}
      >
        {httpErrorToString(error)}
      </div>
    ),
    okText: i18next.t(`${NS_BRICK_KIT}:${K.MODAL_OK}`),
  });
}

export function LoginTimeoutMessage(): React.ReactElement {
  React.useEffect(() => {
    // Unset confirm modal when it's destroyed.
    return () => {
      unauthenticatedConfirmModal = undefined;
    };
  }, []);
  return <div>{i18next.t(`${NS_BRICK_KIT}:${K.LOGIN_TIMEOUT_MESSAGE}`)}</div>;
}

export function getConfOfHttpStatus(
  error: HttpResponseError
): ErrorIllustrationConf {
  switch (error.response?.status) {
    case 403:
      return {
        showBackLink: true,
        title: i18next.t(`${NS_BRICK_KIT}:${K.NO_PERMISSION}`),
        illustration: {
          name: "no-permission",
          category: "easyops2",
        },
      };
    default:
      return null;
  }
}

export function getConfOfHttpCode(
  error: HttpResponseError
): ErrorIllustrationConf {
  switch (error.responseJson?.code) {
    case "200000":
      return {
        title: i18next.t(`${NS_BRICK_KIT}:${K.LICENSE_EXPIRED}`),
        illustration: {
          name: "license-expired",
          category: "easyops2",
        },
      };
    default:
      return {
        showBackLink: true,
        title: i18next.t(`${NS_BRICK_KIT}:${K.OTHER_ERROR}`),
        illustration: {
          name: "unknown-error",
          category: "easyops2",
        },
      };
  }
}

export function getRefinedErrorConf(
  error: HttpResponseError
): ErrorIllustrationConf {
  return [getConfOfHttpStatus, getConfOfHttpCode].reduce(
    (result: ErrorIllustrationConf, method) =>
      result ? result : method(error),
    null
  );
}
