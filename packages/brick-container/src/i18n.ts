export enum K {
  LOGIN_CHANGED = "LOGIN_CHANGED",
  LOGOUT_APPLIED = "LOGOUT_APPLIED",
  BOOTSTRAP_ERROR = "BOOTSTRAP_ERROR",
  NETWORK_ERROR = "NETWORK_ERROR",
  RELOAD = "RELOAD",
  FORCE_CHANGE_PASSWORD_FOR_FIRST_LOGIN = "FORCE_CHANGE_PASSWORD_FOR_FIRST_LOGIN",
  FORCE_CHANGE_PASSWORD_FOR_EXPIRED = "FORCE_CHANGE_PASSWORD_FOR_EXPIRED",
}

const en: Locale = {
  [K.LOGIN_CHANGED]:
    "You have logged in as another account, click OK to refresh the page.",
  [K.LOGOUT_APPLIED]:
    "Your account has been logged out, click OK to refresh the page.",
  [K.BOOTSTRAP_ERROR]: "Bootstrap Error",
  [K.NETWORK_ERROR]: "Network Error",
  [K.RELOAD]: "Reload",
  [K.FORCE_CHANGE_PASSWORD_FOR_FIRST_LOGIN]:
    "This is your first login. Please set your new password before continuing.",
  [K.FORCE_CHANGE_PASSWORD_FOR_EXPIRED]:
    "Your password has expired. Please change your password before continuing.",
};

const zh: Locale = {
  [K.LOGIN_CHANGED]: "您已经登录另一个账号，点击确定刷新页面。",
  [K.LOGOUT_APPLIED]: "您的账号已经登出，点击确定刷新页面。",
  [K.BOOTSTRAP_ERROR]: "启动错误",
  [K.NETWORK_ERROR]: "网络错误",
  [K.RELOAD]: "刷新",
  [K.FORCE_CHANGE_PASSWORD_FOR_FIRST_LOGIN]:
    "初次登录，请先设置新密码后再继续使用平台。",
  [K.FORCE_CHANGE_PASSWORD_FOR_EXPIRED]:
    "密码已过期，修改密码后方可继续使用平台。",
};

export const NS = "-/container";

export const locales = { en, zh };

type Locale = { [key in K]: string };
