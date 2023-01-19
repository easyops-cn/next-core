import { AuthInfo } from "@next-core/brick-types";
import { userAnalytics } from "@next-core/easyops-analytics";
import { resetPermissionPreChecks } from "./internal/checkPermissions";

const auth: AuthInfo = {};

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
    userShowValue: newAuth.userShowValue,
  });

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
  auth.org = undefined;
  auth.username = undefined;
  auth.userInstanceId = undefined;
  auth.accessRule = undefined;
  auth.isAdmin = undefined;
  auth.csrfToken = undefined;
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
