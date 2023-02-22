import { http, HttpOptions } from "@next-core/http";
import { ResponseBodyWrapper } from "../../../wrapper.js";

export interface AuthApi_LdapLoginRequestBody {
  /** 用户名 */
  loginId: string;

  /** 密码 */
  password: string;

  /** 指定 ldapServer */
  ldapServer?: string;
}

export interface AuthApi_LdapLoginResponseBody {
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
}

/**
 * @description ldap 登录
 * @endpoint POST /api/auth/ldap_login
 */
export const AuthApi_ldapLogin = async (
  data: AuthApi_LdapLoginRequestBody,
  options?: HttpOptions
): Promise<AuthApi_LdapLoginResponseBody> =>
  /**! @contract easyops.api.api_gateway.auth.LDAPLogin@1.0.0 */ (
    await http.post<ResponseBodyWrapper<AuthApi_LdapLoginResponseBody>>(
      "api/auth/ldap_login",
      data,
      options
    )
  ).data;
