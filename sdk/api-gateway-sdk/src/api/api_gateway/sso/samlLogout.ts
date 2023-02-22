import { http, HttpOptions } from "@next-core/http";

export interface SsoApi_SamlLogoutRequestParams {
  /** saml xml 返回 */
  SAMLResponse?: string;

  /** 签名 */
  Signature?: string;

  /** 签名算法 */
  SigAlg?: string;
}

/**
 * @description saml slo 接口
 * @endpoint GET /api/v1/sso/saml/logout
 */
export const SsoApi_samlLogout = (
  params: SsoApi_SamlLogoutRequestParams,
  options?: HttpOptions
): Promise<void> =>
  /**! @contract easyops.api.api_gateway.sso.SAMLLogout@1.0.0 */ http.get<void>(
    "api/v1/sso/saml/logout",
    { ...options, params }
  );
