import { http, HttpOptions } from "@next-core/http";
import { ResponseBodyWrapper } from "../../../wrapper.js";

export interface MfaApi_GenerateRandomTotpSecretRequestBody {
  /** 用户名 */
  username: string;

  /** org */
  org?: number;
}

export interface MfaApi_GenerateRandomTotpSecretResponseBody {
  /** totp的字符串 */
  totpSecret?: string;

  /** 密钥 */
  secret?: string;
}

/**
 * @description 随机生成totp secret
 * @endpoint POST /api/v1/mfa/totp/secret
 */
export const MfaApi_generateRandomTotpSecret = async (
  data: MfaApi_GenerateRandomTotpSecretRequestBody,
  options?: HttpOptions
): Promise<MfaApi_GenerateRandomTotpSecretResponseBody> =>
  /**! @contract easyops.api.api_gateway.mfa.GenerateRandomTotpSecret@1.0.0 */ (
    await http.post<
      ResponseBodyWrapper<MfaApi_GenerateRandomTotpSecretResponseBody>
    >("api/v1/mfa/totp/secret", data, options)
  ).data;
