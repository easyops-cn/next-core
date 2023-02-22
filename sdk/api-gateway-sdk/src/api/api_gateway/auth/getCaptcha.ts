import { http, HttpOptions } from "@next-core/http";

/**
 * @description 获取登录验证码
 * @endpoint GET /api/auth/login/get_captcha
 */
export const AuthApi_getCaptcha = (options?: HttpOptions): Promise<Blob> =>
  /**! @contract easyops.api.api_gateway.auth.GetCaptcha@1.0.0 */ http.get<Blob>(
    "api/auth/login/get_captcha",
    { ...options, responseType: "blob" }
  );
