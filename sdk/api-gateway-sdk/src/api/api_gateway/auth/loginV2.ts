import { http, HttpOptions } from "@next-core/http";
import { ResponseBodyWrapper } from "../../../wrapper.js";

export interface AuthApi_LoginV2RequestBody {
  /** 用户名 */
  username: string;

  /** 客户id */
  password: string;

  /** 验证码 */
  phrase?: string;

  /** 校验密码的方式 easyops: 校验 easyops 的账号密码 custom:  通过客户自定义方式校验, 这种方式需要在 sso-adapter 实现和客户对接的逻辑 ldap:    通过 ldap 校验密码 */
  loginBy?: string;
}

export interface AuthApi_LoginV2ResponseBody {
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
}

/**
 * @description 根据指定方式校验密码登录
 * @endpoint POST /api/auth/login/v2
 */
export const AuthApi_loginV2 = async (
  data: AuthApi_LoginV2RequestBody,
  options?: HttpOptions
): Promise<AuthApi_LoginV2ResponseBody> =>
  /**! @contract easyops.api.api_gateway.auth.LoginV2@1.0.0 */ (
    await http.post<ResponseBodyWrapper<AuthApi_LoginV2ResponseBody>>(
      "api/auth/login/v2",
      data,
      options
    )
  ).data;
