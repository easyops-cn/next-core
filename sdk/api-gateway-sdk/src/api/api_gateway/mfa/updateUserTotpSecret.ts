import { http, HttpOptions } from "@next-core/http";

export interface MfaApi_UpdateUserTotpSecretRequestBody {
  /** 用户名 */
  username: string;

  /** org */
  org?: number;

  /** 密钥 */
  secret: string;
}

/**
 * @description 创建totp的密钥到数据库
 * @endpoint POST /api/v1/mfa/totp/user/secret
 */
export const MfaApi_updateUserTotpSecret = (
  data: MfaApi_UpdateUserTotpSecretRequestBody,
  options?: HttpOptions
): Promise<void> =>
  /**! @contract easyops.api.api_gateway.mfa.UpdateUserTotpSecret@1.1.0 */ http.post<void>(
    "api/v1/mfa/totp/user/secret",
    data,
    options
  );
