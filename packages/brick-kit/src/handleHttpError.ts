import {
  HttpResponseError,
  HttpParseError,
  HttpFetchError,
} from "@easyops/brick-http";
import { Modal } from "antd";
import { ModalFunc } from "antd/lib/modal/Modal";
import i18next from "i18next";
import { K, NS_BRICK_KIT } from "./i18n/constants";
import { getHistory } from "./history";
import { isUnauthenticatedError } from "./isUnauthenticatedError";

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
