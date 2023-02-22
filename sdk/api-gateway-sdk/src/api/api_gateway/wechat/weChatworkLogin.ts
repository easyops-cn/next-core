import { http, HttpOptions } from "@next-core/http";
import { ResponseBodyWrapper } from "../../../wrapper.js";

export interface WechatApi_WeChatworkLoginResponseBody {
  /** 生成的链接 */
  url: string;
}

/**
 * @description 企业微信登录；根据配置文件构造扫码登录链接
 * @endpoint GET /api/api_gateway/v1/wechatwork/login
 */
export const WechatApi_weChatworkLogin = async (
  options?: HttpOptions
): Promise<WechatApi_WeChatworkLoginResponseBody> =>
  /**! @contract easyops.api.api_gateway.wechat.WeChatworkLogin@1.0.0 */ (
    await http.get<ResponseBodyWrapper<WechatApi_WeChatworkLoginResponseBody>>(
      "api/api_gateway/v1/wechatwork/login",
      options
    )
  ).data;
