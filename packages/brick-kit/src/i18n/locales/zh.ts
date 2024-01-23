import { Locale, K } from "../constants";

const locale: Locale = {
  [K.REQUEST_FAILED]: "请求失败",
  [K.MODAL_OK]: "确认",
  [K.MODAL_CANCEL]: "取消",
  [K.SOMETHING_WENT_WRONG]: "出现了一些问题！",
  [K.LOGIN_TIMEOUT_MESSAGE]: "您还未登录或登录信息已过期，现在重新登录？",
  [K.NETWORK_ERROR]: "网络错误，请检查您的网络连接。",
  [K.PAGE_NOT_FOUND]: "请求的页面未找到，请确认 URL 是否正确",
  [K.APP_NOT_FOUND]: "请求的微应用无法找到, 可能是 URL 错误或者无权限访问",
  [K.LICENSE_EXPIRED]: "License 授权失效，请联系平台管理员",
  [K.NO_PERMISSION]: "没有权限，无法获取页面所需要的资源",
  [K.OTHER_ERROR]: "糟糕！页面出现了一些问题",
  [K.GO_BACK_PREVIOUS_PAGE]: "回到上一页",
  [K.GO_BACK_HOME_PAGE]: "回到首页",
};

export default locale;
