import { http, HttpOptions } from "@next-core/http";
import { ResponseBodyWrapper } from "../../../wrapper.js";

export interface WechatMiniprogramApi_MiniProgramLoginRequestBody {
  /** 微信登陆授权code */
  code: string;

  /** 微信获取手机号授权code */
  phoneCode?: string;
}

export interface WechatMiniprogramApi_MiniProgramLoginResponseBody {
  /** 微信平台统一账号unionId */
  unionId?: string;

  /** 电话 */
  telephone?: string;

  /** 登录签发的token, 需要在后续请求的 header 附带 Authorization: token */
  token?: string;

  /** 更新 token, 只能用来进行更新 token, 在 header 附带 Authorization: Bearer refreshToken */
  refreshToken?: string;

  /** 来源客户ID */
  customerId?: string;

  /** 客户名称 */
  customerName?: string;
}

/**
 * @description 小程序登录
 * @endpoint POST /api/api_gateway/v1/wechat/mini_program/login
 */
export const WechatMiniprogramApi_miniProgramLogin = async (
  data: WechatMiniprogramApi_MiniProgramLoginRequestBody,
  options?: HttpOptions
): Promise<WechatMiniprogramApi_MiniProgramLoginResponseBody> =>
  /**! @contract easyops.api.api_gateway.wechat_miniprogram.MiniProgramLogin@1.0.0 */ (
    await http.post<
      ResponseBodyWrapper<WechatMiniprogramApi_MiniProgramLoginResponseBody>
    >("api/api_gateway/v1/wechat/mini_program/login", data, options)
  ).data;
