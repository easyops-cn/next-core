import { http, HttpOptions } from "@next-core/http";
import { ResponseBodyWrapper } from "../../../wrapper.js";

export interface AuthApi_RefreshTokenResponseBody {
  /** 认证 token, 需要在后续请求的 header 附带 Authorization: Bear token */
  token?: string;

  /** 更新 token, 只能用来进行更新 token, 在 header 附带 Authorization: Bearer refreshToken */
  refreshToken?: string;
}

/**
 * @description 更新 token
 * @endpoint POST /api/auth/token/refresh
 */
export const AuthApi_refreshToken = async (
  options?: HttpOptions
): Promise<AuthApi_RefreshTokenResponseBody> =>
  /**! @contract easyops.api.api_gateway.auth.RefreshToken@1.0.0 */ (
    await http.post<ResponseBodyWrapper<AuthApi_RefreshTokenResponseBody>>(
      "api/auth/token/refresh",
      undefined,
      options
    )
  ).data;
