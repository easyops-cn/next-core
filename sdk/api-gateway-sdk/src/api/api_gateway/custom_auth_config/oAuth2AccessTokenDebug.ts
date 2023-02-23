import { http, HttpOptions } from "@next-core/http";
import { ModelCustomAuthConfigOAuth2 } from "../../../model/api_gateway/index.js";
import { ResponseBodyWrapper } from "../../../wrapper.js";

export type CustomAuthConfigApi_OAuth2AccessTokenDebugRequestBody =
  Partial<ModelCustomAuthConfigOAuth2> & ModelCustomAuthConfigOAuth2_partial;

export type CustomAuthConfigApi_OAuth2AccessTokenDebugResponseBody = Record<
  string,
  any
>;

/**
 * @description OAuth2 Access Token 调试
 * @endpoint POST /api/v1/api_gateway/custom_auth_config/oauth2_access_token/debug
 */
export const CustomAuthConfigApi_oAuth2AccessTokenDebug = async (
  data: CustomAuthConfigApi_OAuth2AccessTokenDebugRequestBody,
  options?: HttpOptions
): Promise<CustomAuthConfigApi_OAuth2AccessTokenDebugResponseBody> =>
  /**! @contract easyops.api.api_gateway.custom_auth_config.OAuth2AccessTokenDebug@1.2.0 */ (
    await http.post<
      ResponseBodyWrapper<CustomAuthConfigApi_OAuth2AccessTokenDebugResponseBody>
    >(
      "api/v1/api_gateway/custom_auth_config/oauth2_access_token/debug",
      data,
      options
    )
  ).data;

export interface ModelCustomAuthConfigOAuth2_partial {
  /** token请求URL */
  accessTokenUrl: string;

  /** token请求方法 */
  accessTokenMethod: string;
}
