import { http, HttpOptions } from "@next-core/http";

export interface OauthApi_OauthLoginRequestParams {
  /** service */
  service: string;
}

/**
 * @description Oauth登录 (根据配置文件选择Oauth的实现；将请求重定向到指定的Oauth Server中)
 * @endpoint GET /api/auth/oauth/login
 */
export const OauthApi_oauthLogin = (
  params: OauthApi_OauthLoginRequestParams,
  options?: HttpOptions
): Promise<void> =>
  /**! @contract easyops.api.api_gateway.oauth.OauthLogin@1.0.0 */ http.get<void>(
    "api/auth/oauth/login",
    { ...options, params }
  );
