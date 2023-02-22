import { http, HttpOptions } from "@next-core/http";
import { ResponseBodyWrapper } from "../../../wrapper.js";

export interface SsoApi_SsoLoginResponseBody {
  /** 请求方法，默认是GET方法 */
  method?: "POST" | "GET";

  /** 请求体参数 */
  requestArgs?: Record<string, any>;

  /** 重定向的地址, 该接口的控制层会根据这个url返回重定向响应, 而不是直接返回这个数据 */
  redirectURL?: string;
}

/**
 * @description SSO登录; 将请求重定向到指定的身份认证服务中
 * @endpoint GET /api/v1/sso/login/:protocol
 */
export const SsoApi_ssoLogin = async (
  protocol: string | number,
  options?: HttpOptions
): Promise<SsoApi_SsoLoginResponseBody> =>
  /**! @contract easyops.api.api_gateway.sso.SSOLogin@1.1.0 */ (
    await http.get<ResponseBodyWrapper<SsoApi_SsoLoginResponseBody>>(
      `api/v1/sso/login/${protocol}`,
      options
    )
  ).data;
