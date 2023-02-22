import { http, HttpOptions } from "@next-core/http";
import { ResponseBodyWrapper } from "../../../wrapper.js";

export interface SsoApi_SsoAuthorizationTokenRequestBody {
  /** 自定义参数键值对 */
  data?: Record<string, any>;
}

export interface SsoApi_SsoAuthorizationTokenResponseBody {
  /** jwt access token */
  accessToken?: string;

  /** jwt refresh token */
  refreshToken?: string;

  /** 用户名 */
  username?: string;

  /** 客户id */
  org?: number;
}

/**
 * @description 通过登录凭证换取 jwt token, 会转发请求到 sso_adapter
 * @endpoint POST /api/v1/sso/authorization/:protocol/token
 */
export const SsoApi_ssoAuthorizationToken = async (
  protocol: string | number,
  data: SsoApi_SsoAuthorizationTokenRequestBody,
  options?: HttpOptions
): Promise<SsoApi_SsoAuthorizationTokenResponseBody> =>
  /**! @contract easyops.api.api_gateway.sso.SSOAuthorizationToken@1.0.0 */ (
    await http.post<
      ResponseBodyWrapper<SsoApi_SsoAuthorizationTokenResponseBody>
    >(`api/v1/sso/authorization/${protocol}/token`, data, options)
  ).data;
