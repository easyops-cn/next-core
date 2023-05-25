import type { AuthApi_CheckLoginResponseBody } from "@next-api-sdk/api-gateway-sdk";
// import { resetPermissionPreChecks } from "./internal/checkPermissions.js";

const auth: AuthInfo = {};

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
    userShowValue: newAuth.userShowValue,
  });
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
  // resetPermissionPreChecks();
}

/**
 * 查看当前是否已登录。
 *
 * @returns 当前是否已登录。
 */
export function isLoggedIn(): boolean {
  return auth.username !== undefined;
}
