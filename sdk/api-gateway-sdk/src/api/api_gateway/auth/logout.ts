import { http, HttpOptions } from "@next-core/http";

/**
 * @description 退出登录
 * @endpoint POST /api/auth/logout
 */
export const AuthApi_logout = (options?: HttpOptions): Promise<void> =>
  /**! @contract easyops.api.api_gateway.auth.Logout@1.0.0 */ http.post<void>(
    "api/auth/logout",
    undefined,
    options
  );
