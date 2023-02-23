import { http, HttpOptions } from "@next-core/http";

/**
 * @description Oauth注销
 * @endpoint GET /api/auth/oauth/logout
 */
export const OauthApi_oauthLogout = (options?: HttpOptions): Promise<void> =>
  /**! @contract easyops.api.api_gateway.oauth.OauthLogout@1.0.0 */ http.get<void>(
    "api/auth/oauth/logout",
    options
  );
