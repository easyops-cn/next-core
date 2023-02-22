import { http, HttpOptions } from "@next-core/http";

/**
 * @description SSO注销
 * @endpoint POST /api/v1/sso/logout/:protocol
 */
export const SsoApi_ssoLogout = (
  protocol: string | number,
  options?: HttpOptions
): Promise<void> =>
  /**! @contract easyops.api.api_gateway.sso.SSOLogout@1.0.0 */ http.post<void>(
    `api/v1/sso/logout/${protocol}`,
    undefined,
    options
  );
