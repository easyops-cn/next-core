export enum K {
  REQUEST_FAILED = "REQUEST_FAILED",
  SOMETHING_WENT_WRONG = "SOMETHING_WENT_WRONG",
  LOGIN_TIMEOUT_MESSAGE = "LOGIN_TIMEOUT_MESSAGE",
  NETWORK_ERROR = "NETWORK_ERROR",
  LICENSE_EXPIRED = "LICENSE_EXPIRED",
  NO_PERMISSION = "NO_PERMISSION",
  PAGE_NOT_FOUND = "PAGE_NOT_FOUND",
  APP_NOT_FOUND = "APP_NOT_FOUND",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
  GO_BACK_TO_PREVIOUS_PAGE = "GO_BACK_TO_PREVIOUS_PAGE",
  GO_BACK_HOME = "GO_BACK_HOME",
}

const en: Locale = {
  [K.REQUEST_FAILED]: "Request Failed",
  [K.SOMETHING_WENT_WRONG]: "Something went wrong!",
  [K.LOGIN_TIMEOUT_MESSAGE]:
    "You haven't logged in or your login session has expired. Login right now?",
  [K.NETWORK_ERROR]: "Network error, please check your network.",
  [K.LICENSE_EXPIRED]:
    "The license authorization has expired, please contact the platform administrator",
  [K.NO_PERMISSION]:
    "Unauthorized access, unable to retrieve the required resources for this page",
  [K.PAGE_NOT_FOUND]: "Page not found, please check the URL",
  [K.APP_NOT_FOUND]:
    "App not found, maybe the URL is wrong or you don't have permission to access",
  [K.UNKNOWN_ERROR]: "Oops! Something went wrong",
  [K.GO_BACK_TO_PREVIOUS_PAGE]: "Go back to previous page",
  [K.GO_BACK_HOME]: "Go back to home page",
};

const zh: Locale = {
  [K.REQUEST_FAILED]: "请求失败",
  [K.SOMETHING_WENT_WRONG]: "出现了一些问题！",
  [K.LOGIN_TIMEOUT_MESSAGE]: "您还未登录或登录信息已过期，现在重新登录？",
  [K.NETWORK_ERROR]: "网络错误，请检查您的网络连接。",
  [K.LICENSE_EXPIRED]: "License 授权失效，请联系平台管理员",
  [K.NO_PERMISSION]: "没有权限，无法获取页面所需要的资源",
  [K.PAGE_NOT_FOUND]: "请求的页面未找到，请确认 URL 是否正确",
  [K.APP_NOT_FOUND]: "请求的微应用无法找到, 可能是 URL 错误或者无权限访问",
  [K.UNKNOWN_ERROR]: "糟糕！页面出现了一些问题",
  [K.GO_BACK_TO_PREVIOUS_PAGE]: "回到上一页",
  [K.GO_BACK_HOME]: "回到首页",
};

export const NS = "core/runtime";

export const locales = { en, zh };

type Locale = { [key in K]: string };
