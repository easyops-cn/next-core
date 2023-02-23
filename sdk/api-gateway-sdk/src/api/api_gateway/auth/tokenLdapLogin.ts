import { http, HttpOptions } from "@next-core/http";
import { ResponseBodyWrapper } from "../../../wrapper.js";

export interface AuthApi_TokenLdapLoginRequestBody {
  /** 用户名 */
  loginId: string;

  /** 密码 */
  password: string;

  /** 指定 ldapServer */
  ldapServer?: string;
}

export interface AuthApi_TokenLdapLoginResponseBody {
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

  /** 认证 token, 需要在后续请求的 header 附带 Authorization: token */
  token?: string;

  /** 更新 token, 只能用来进行更新 token, 在 header 附带 Authorization: Bearer refreshToken */
  refreshToken?: string;
}

/**
 * @description ldap 登录成功后，返回 token
 * @endpoint POST /api/auth/token/ldap_login
 */
export const AuthApi_tokenLdapLogin = async (
  data: AuthApi_TokenLdapLoginRequestBody,
  options?: HttpOptions
): Promise<AuthApi_TokenLdapLoginResponseBody> =>
  /**! @contract easyops.api.api_gateway.auth.TokenLDAPLogin@1.0.0 */ (
    await http.post<ResponseBodyWrapper<AuthApi_TokenLdapLoginResponseBody>>(
      "api/auth/token/ldap_login",
      data,
      options
    )
  ).data;
