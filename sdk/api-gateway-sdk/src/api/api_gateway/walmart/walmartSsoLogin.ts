import { http, HttpOptions } from "@next-core/http";
import { ResponseBodyWrapper } from "../../../wrapper.js";

export interface WalmartApi_WalmartSsoLoginRequestBody {
  /** 前端得到的code，用于后端解密成token */
  code: string;
}

export interface WalmartApi_WalmartSsoLoginResponseBody {
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
}

/**
 * @description 沃尔玛sso登录 -【定制化】
 * @endpoint POST /api/walmart/sso/login
 */
export const WalmartApi_walmartSsoLogin = async (
  data: WalmartApi_WalmartSsoLoginRequestBody,
  options?: HttpOptions
): Promise<WalmartApi_WalmartSsoLoginResponseBody> =>
  /**! @contract easyops.api.api_gateway.walmart.WalmartSSOLogin@1.0.2 */ (
    await http.post<
      ResponseBodyWrapper<WalmartApi_WalmartSsoLoginResponseBody>
    >("api/walmart/sso/login", data, options)
  ).data;
