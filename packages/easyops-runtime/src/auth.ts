import { getBasePath, matchPath } from "@next-core/runtime";
import type { AuthApi_CheckLoginResponseBody } from "@next-api-sdk/api-gateway-sdk";
import { createLocation, type LocationDescriptor } from "history";
import { resetPermissionPreChecks } from "./checkPermissions.js";

const auth: AuthInfo = {};
let pathBlackListSet = new Set<string>();

/** @internal */
export type AuthInfo = Omit<AuthApi_CheckLoginResponseBody, "loggedIn">;

/** @internal */
export function authenticate(newAuth: AuthInfo): void {
  Object.assign(auth, {
    org: newAuth.org,
    username: newAuth.username,
    userInstanceId: newAuth.userInstanceId,
    loginFrom: newAuth.loginFrom,
    accessRule: newAuth.accessRule,
    isAdmin: newAuth.isAdmin,
    csrfToken: newAuth.csrfToken,
    license: newAuth.license,
    accessToken: newAuth.accessToken,
    userShowValue: newAuth.userShowValue,
  });

  pathBlackListSet = new Set(newAuth.license?.blackList);
}

/**
 * 获取当前登录认证信息。
 *
 * @returns 当前登录认证信息。
 */
export function getAuth(): AuthInfo {
  return {
    ...auth,
  };
}

/** @internal */
export function logout(): void {
  for (const key of Object.keys(auth) as (keyof AuthInfo)[]) {
    auth[key] = undefined;
  }
  resetPermissionPreChecks();
}

/**
 * 查看当前是否已登录。
 *
 * @returns 当前是否已登录。
 */
export function isLoggedIn(): boolean {
  return auth.username !== undefined;
}

/**
 * 增加路径黑名单
 */
export function addPathToBlackList(path: string): void {
  pathBlackListSet.add(path);
}

/**
 * 判断一个内部 URL 路径是否被屏蔽。
 */
export function isBlockedPath(pathname: string): boolean {
  return [...pathBlackListSet].some((path) => matchPath(pathname, { path }));
}

/**
 * 判断一个内部 URL 是否被屏蔽。
 */
export function isBlockedUrl(url: string | LocationDescriptor): boolean {
  const pathname = (typeof url === "string" ? createLocation(url) : url)
    .pathname;
  if (typeof pathname !== "string") {
    return false;
  }
  return isBlockedPath(pathname);
}

/**
 * 判断一个 href 是否被屏蔽。
 */
export function isBlockedHref(href: string): boolean {
  const basePath = getBasePath();
  const url = new URL(href, `${location.origin}${basePath}`);
  // 忽略外链地址
  if (url.origin !== location.origin || !url.pathname.startsWith(basePath)) {
    return false;
  }
  // 转换为内部路径
  return isBlockedPath(url.pathname.substring(basePath.length - 1));
}
