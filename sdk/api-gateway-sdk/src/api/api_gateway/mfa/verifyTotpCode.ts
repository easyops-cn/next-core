import { http, HttpOptions } from "@next-core/http";
import { ResponseBodyWrapper } from "../../../wrapper.js";

export interface MfaApi_VerifyTotpCodeRequestBody {
  /** 用户名 */
  username: string;

  /** 用户instanceId */
  userInstanceId: string;

  /** 用户org */
  org: number;

  /** 动态码 */
  verifyCode: string;
}

export interface MfaApi_VerifyTotpCodeResponseBody {
  /** 是否已经登录 */
  loggedIn?: boolean;

  /** 用户名 */
  username?: string;

  /** 客户id */
  org?: number;

  /** 用户地理位置 */
  location?: string;

  /** 用户 id */
  userInstanceId?: string;

  /** 用户来源 */
  loginFrom?: string;

  /** 判断当前登录用户是否是系统管理员 */
  isAdmin?: boolean;
}

/**
 * @description 验证动态码
 * @endpoint POST /api/v1/mfa/totp/verification
 */
export const MfaApi_verifyTotpCode = async (
  data: MfaApi_VerifyTotpCodeRequestBody,
  options?: HttpOptions
): Promise<MfaApi_VerifyTotpCodeResponseBody> =>
  /**! @contract easyops.api.api_gateway.mfa.VerifyTotpCode@1.1.0 */ (
    await http.post<ResponseBodyWrapper<MfaApi_VerifyTotpCodeResponseBody>>(
      "api/v1/mfa/totp/verification",
      data,
      options
    )
  ).data;
