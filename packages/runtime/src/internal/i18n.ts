export enum K {
  REQUEST_FAILED = "REQUEST_FAILED",
  SOMETHING_WENT_WRONG = "SOMETHING_WENT_WRONG",
  LOGIN_TIMEOUT_MESSAGE = "LOGIN_TIMEOUT_MESSAGE",
  NETWORK_ERROR = "NETWORK_ERROR",
}

const en: Locale = {
  [K.REQUEST_FAILED]: "Request Failed",
  [K.SOMETHING_WENT_WRONG]: "Something went wrong!",
  [K.LOGIN_TIMEOUT_MESSAGE]:
    "You haven't logged in or your login session has expired. Login right now?",
  [K.NETWORK_ERROR]: "Network error, please check your network.",
};

const zh: Locale = {
  [K.REQUEST_FAILED]: "请求失败",
  [K.SOMETHING_WENT_WRONG]: "出现了一些问题！",
  [K.LOGIN_TIMEOUT_MESSAGE]: "您还未登录或登录信息已过期，现在重新登录？",
  [K.NETWORK_ERROR]: "网络错误，请检查您的网络连接。",
};

export const NS = "core/runtime";

export const locales = { en, zh };

type Locale = { [key in K]: string };
