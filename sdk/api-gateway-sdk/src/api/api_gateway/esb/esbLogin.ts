import { http, HttpOptions } from "@next-core/http";
import { ResponseBodyWrapper } from "../../../wrapper.js";

export interface EsbApi_EsbLoginRequestBody {
  /** 用户名 */
  username: string;

  /** 密码 */
  password: string;
}

export interface EsbApi_EsbLoginResponseBody {
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
 * @description esb 登录 -【定制化需求】台州银行esb统一认证
 * @endpoint POST /api/esb/login
 */
export const EsbApi_esbLogin = async (
  data: EsbApi_EsbLoginRequestBody,
  options?: HttpOptions
): Promise<EsbApi_EsbLoginResponseBody> =>
  /**! @contract easyops.api.api_gateway.esb.EsbLogin@1.1.0 */ (
    await http.post<ResponseBodyWrapper<EsbApi_EsbLoginResponseBody>>(
      "api/esb/login",
      data,
      options
    )
  ).data;
