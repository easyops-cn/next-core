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
  [K.LICENSE_BLOCKED]: "该页面未授权，请联系平台管理员",
  [K.NO_PERMISSION]: "没有权限，无法获取页面所需要的资源",
  [K.OTHER_ERROR]: "糟糕！页面出现了一些问题",
  [K.GO_BACK_PREVIOUS_PAGE]: "回到上一页",
  [K.GO_BACK_HOME_PAGE]: "回到首页",
  [K.LOGIN_CHANGED]: "您已经登录另一个账号，点击确定刷新页面。",
  [K.LOGOUT_APPLIED]: "您的账号已经登出，点击确定刷新页面。",
  [K.LICENSE_EXPIRES_IN_DAY]: "离License过期还有 {{count}} 天",
  [K.PAGE_RENDER_SLOW_TIP]:
    "您的页面存在性能问题, 当前页面渲染时间 {{renderTime}} 秒, 规定阈值为: {{suggestTime}} 秒, 您已超过。请您针对该页面进行性能优化!",
  [K.VIEW_SUGGESTION]: "建议解决思路",
};

export default locale;
