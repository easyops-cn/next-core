import { http, HttpOptions } from "@next-core/http";

export interface WechatApi_WeChatworkAuthorizationRequestParams {
  /** 扫码授权获取到的code */
  code: string;

  /** 扫码授权获取到的appid */
  appid: string;
}

/**
 * @description 企业微信认证 (扫码登录成功后，会携带code和appid重定向到该接口，获取用户信息UserId)
 * @endpoint GET /api/api_gateway/v1/wechatwork/authorization
 */
export const WechatApi_weChatworkAuthorization = (
  params: WechatApi_WeChatworkAuthorizationRequestParams,
  options?: HttpOptions
): Promise<void> =>
  /**! @contract easyops.api.api_gateway.wechat.WeChatworkAuthorization@1.0.0 */ http.get<void>(
    "api/api_gateway/v1/wechatwork/authorization",
    { ...options, params }
  );
