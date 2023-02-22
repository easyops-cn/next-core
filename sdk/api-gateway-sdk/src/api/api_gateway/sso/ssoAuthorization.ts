import { http, HttpOptions } from "@next-core/http";

/** HTTP GET query */
export type SsoApi_SsoAuthorizationRequestParams = Record<string, any>;

/**
 * @description SSO访问令牌认证; SSO身份认证成功后认证服务将会携带 登录凭证 重定向至该接口
 * @endpoint GET /api/v1/sso/authorization/:protocol
 */
export const SsoApi_ssoAuthorization = (
  protocol: string | number,
  params: SsoApi_SsoAuthorizationRequestParams,
  options?: HttpOptions
): Promise<void> =>
  /**! @contract easyops.api.api_gateway.sso.SSOAuthorization@1.0.0 */ http.get<void>(
    `api/v1/sso/authorization/${protocol}`,
    { ...options, params }
  );
