import { http, HttpOptions } from "@next-core/http";

export type SsoApi_SsoAuthorizeRedirectRequestBody = any;

/**
 * @description SSO访问令牌认证; SSO身份认证成功后认证服务将会携带 登录凭证 重定向至该接口 (该接口最后会直接重定向到easyops平台的/next/sso-auth/authorize页面，可以是GET请求也可以是POST请求)
 * @endpoint POST /api/v2/sso/authorization
 */
export const SsoApi_ssoAuthorizeRedirect = (
  data: SsoApi_SsoAuthorizeRedirectRequestBody,
  options?: HttpOptions
): Promise<void> =>
  /**! @contract easyops.api.api_gateway.sso.SSOAuthorizeRedirect@1.0.0 */ http.post<void>(
    "api/v2/sso/authorization",
    data,
    options
  );
