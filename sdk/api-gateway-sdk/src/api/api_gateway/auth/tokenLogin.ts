import { http, HttpOptions } from "@next-core/http";
import { ResponseBodyWrapper } from "../../../wrapper.js";

export interface AuthApi_TokenLoginRequestBody {
  /** 用户名 */
  username: string;

  /** 密码 */
  password: string;
}

export interface AuthApi_TokenLoginResponseBody {
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
 * @description 登录成功后，返回 token
 * @endpoint POST /api/auth/token/login
 */
export const AuthApi_tokenLogin = async (
  data: AuthApi_TokenLoginRequestBody,
  options?: HttpOptions
): Promise<AuthApi_TokenLoginResponseBody> =>
  /**! @contract easyops.api.api_gateway.auth.TokenLogin@1.0.0 */ (
    await http.post<ResponseBodyWrapper<AuthApi_TokenLoginResponseBody>>(
      "api/auth/token/login",
      data,
      options
    )
  ).data;
