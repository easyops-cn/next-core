import { http, HttpOptions } from "@next-core/http";
import { ResponseBodyWrapper } from "../../../wrapper.js";

export interface MfaApi_VerifyUserIsSetRuleRequestParams {
  /** 用户名 */
  username: string;

  /** 用户的org */
  org: number;

  /** 登陆方式，目前支持["easyops", "ldap", "custom"] */
  loginBy: string;
}

export interface MfaApi_VerifyUserIsSetRuleResponseBody {
  /** 该用户是否设置了双因子规则 */
  isSet?: boolean;
}

/**
 * @description 验证用户是否设置了totp的规则
 * @endpoint GET /api/v1/mfa/totp/user/rule/verification
 */
export const MfaApi_verifyUserIsSetRule = async (
  params: MfaApi_VerifyUserIsSetRuleRequestParams,
  options?: HttpOptions
): Promise<MfaApi_VerifyUserIsSetRuleResponseBody> =>
  /**! @contract easyops.api.api_gateway.mfa.VerifyUserIsSetRule@1.1.0 */ (
    await http.get<ResponseBodyWrapper<MfaApi_VerifyUserIsSetRuleResponseBody>>(
      "api/v1/mfa/totp/user/rule/verification",
      { ...options, params }
    )
  ).data;
