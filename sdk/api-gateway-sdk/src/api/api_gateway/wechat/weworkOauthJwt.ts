import { http, HttpOptions } from "@next-core/http";
import { ResponseBodyWrapper } from "../../../wrapper.js";

export interface WechatApi_WeworkOauthJwtRequestParams {
  /** 通过成员授权获取到的code */
  code?: string;
}

export interface WechatApi_WeworkOauthJwtResponseBody {
  /** jwt refreshToken */
  accessToken: string;

  /** jwt refreshToken */
  refreshToken: string;
}

/**
 * @description 通过企业微信重定向携带的 code 获取用户 jwt
 * @endpoint GET /api/api_gateway/v1/wechatwork/login/withcode
 */
export const WechatApi_weworkOauthJwt = async (
  params: WechatApi_WeworkOauthJwtRequestParams,
  options?: HttpOptions
): Promise<WechatApi_WeworkOauthJwtResponseBody> =>
  /**! @contract easyops.api.api_gateway.wechat.WeworkOauthJwt@1.0.0 */ (
    await http.get<ResponseBodyWrapper<WechatApi_WeworkOauthJwtResponseBody>>(
      "api/api_gateway/v1/wechatwork/login/withcode",
      { ...options, params }
    )
  ).data;
