import { http, HttpOptions } from "@next-core/http";

export interface OauthApi_OauthAuthorizateRequestParams {
  /** access token */
  code: string;

  /** state */
  state?: string;
}

/**
 * @description Oauth认证 (在Oauth Server中登录成功后，会携带 authorization_code 重定向到该接口，根据配置文件选择Oauth的实现，通过Oauth Server返回的认证信息向 Oauth Server获取用户信息、服务访问权限等信息")
 * @endpoint GET /api/auth/oauth/authorizate/:provider
 */
export const OauthApi_oauthAuthorizate = (
  provider: string | number,
  params: OauthApi_OauthAuthorizateRequestParams,
  options?: HttpOptions
): Promise<void> =>
  /**! @contract easyops.api.api_gateway.oauth.OauthAuthorizate@1.0.0 */ http.get<void>(
    `api/auth/oauth/authorizate/${provider}`,
    { ...options, params }
  );
