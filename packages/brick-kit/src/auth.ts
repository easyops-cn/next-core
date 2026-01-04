import { AuthInfo } from "@next-core/brick-types";
import { matchPath } from "@next-core/brick-utils";
import { userAnalytics } from "@next-core/easyops-analytics";
import { createLocation, type LocationDescriptor } from "history";
import { resetPermissionPreChecks } from "./internal/checkPermissions";
import { getBasePath } from "./internal/getBasePath";
import { getRuntime } from "./runtime";

const auth: AuthInfo = {};
let pathBlackListSet = new Set<string>();

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

  // re-init analytics to set user_id
  if (userAnalytics.initialized) {
    userAnalytics.setUserId(newAuth.userInstanceId);
  }
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
    auth[key] = undefined as never;
  }
  resetPermissionPreChecks();

  // re-init analytics to clear user_id
  userAnalytics.setUserId();
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
 *
 * @param pathnameWithQuery - 路径（可包含查询字符串）
 * @returns 是否被屏蔽
 */
export function isBlockedPath(pathnameWithQuery: string): boolean {
  return [...pathBlackListSet].some((pattern) => {
    // 分离 pattern 的路径和查询字符串
    const [patternPath, patternQuery] = pattern.split("?");

    // 分离待检查路径的路径和查询字符串
    const [pathname, pathQuery] = pathnameWithQuery.split("?");

    // 首先匹配路径部分
    const pathMatched = matchPath(pathname, { path: patternPath });
    if (!pathMatched) {
      return false;
    }

    // 如果 pattern 不包含查询字符串，只要路径匹配就返回 true
    if (!patternQuery) {
      return true;
    }

    // 如果 pattern 包含查询字符串，但待检查路径没有，返回 false
    if (!pathQuery) {
      return false;
    }

    // 精确匹配查询字符串（所有 pattern 中的参数必须存在且值相同）
    const patternParams = new URLSearchParams(patternQuery);
    const pathParams = new URLSearchParams(pathQuery);

    for (const [key, value] of patternParams.entries()) {
      if (pathParams.get(key) !== value) {
        return false;
      }
    }

    return true;
  });
}

/**
 * 根据特性开关决定是否拼接查询字符串
 * @param pathname - 路径名
 * @param search - 查询字符串（可选）
 * @returns 拼接后的路径
 */
function getPathnameWithQuery(pathname: string, search?: string): string {
  const flags = getRuntime()?.getFeatureFlags();
  const blackListPreserveQueryFlag = flags?.["blacklist-preserve-query-string"];
  return blackListPreserveQueryFlag && search ? pathname + search : pathname;
}

/**
 * 判断一个内部 URL 是否被屏蔽。
 */
export function isBlockedUrl(url: string | LocationDescriptor): boolean {
  const location = typeof url === "string" ? createLocation(url) : url;
  const pathname = location.pathname;
  if (typeof pathname !== "string") {
    return false;
  }
  const pathnameWithQuery = getPathnameWithQuery(pathname, location.search);
  return isBlockedPath(pathnameWithQuery);
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
  const internalPath = url.pathname.substring(basePath.length - 1);
  const pathnameWithQuery = getPathnameWithQuery(internalPath, url.search);
  return isBlockedPath(pathnameWithQuery);
}
