import { http, HttpOptions } from "@next-core/http";
import { ResponseBodyWrapper } from "../../../wrapper.js";

export interface AuthApi_CheckLoginResponseBody {
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

  /** 访问规则(例如按照平台区分 cmdb,ops) */
  accessRule?: string;

  /** 判断当前登录用户是否是系统管理员 */
  isAdmin?: boolean;

  /** csrf_token，开启了csrf特性才返回值 */
  csrfToken?: string;

  /** license info */
  license?: AuthApi_CheckLoginResponseBody_license;

  /** 主名称 次名称 */
  userShowValue?: string[];
}

/**
 * @description 判断用户是否登录
 * @endpoint GET /api/auth/login
 */
export const AuthApi_checkLogin = async (
  options?: HttpOptions
): Promise<AuthApi_CheckLoginResponseBody> =>
  /**! @contract easyops.api.api_gateway.auth.CheckLogin@1.1.4 */ (
    await http.get<ResponseBodyWrapper<AuthApi_CheckLoginResponseBody>>(
      "api/auth/login",
      options
    )
  ).data;

export interface AuthApi_CheckLoginResponseBody_license {
  /** 过期时间。如 02-Nov-2022 */
  expires?: string;

  /** 剩余有效天数 */
  validDaysLeft?: number;
}
