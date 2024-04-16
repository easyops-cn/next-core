export enum K {
  LOGIN_CHANGED = "LOGIN_CHANGED",
  LOGOUT_APPLIED = "LOGOUT_APPLIED",
}

const en: Locale = {
  [K.LOGIN_CHANGED]:
    "You have logged in as another account, click OK to refresh the page.",
  [K.LOGOUT_APPLIED]:
    "Your account has been logged out, click OK to refresh the page.",
};

const zh: Locale = {
  [K.LOGIN_CHANGED]: "您已经登录另一个账号，点击确定刷新页面。",
  [K.LOGOUT_APPLIED]: "您的账号已经登出，点击确定刷新页面。",
};

export const NS = "-/container";

export const locales = { en, zh };

type Locale = { [key in K]: string };
