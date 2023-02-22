import { http, HttpOptions } from "@next-core/http";
import { ModelCustomAuthConfig } from "../../../model/api_gateway/index.js";
import { ResponseBodyWrapper } from "../../../wrapper.js";

export type CustomAuthConfigApi_CreateCustomAuthConfigRequestBody =
  Partial<ModelCustomAuthConfig> &
    ModelCustomAuthConfig_partial &
    CustomAuthConfigApi_CreateCustomAuthConfigRequestBody_2;

export type CustomAuthConfigApi_CreateCustomAuthConfigResponseBody =
  Partial<ModelCustomAuthConfig> &
    CustomAuthConfigApi_CreateCustomAuthConfigResponseBody_2;

/**
 * @description 创建服务认证配置
 * @endpoint POST /api/v1/api_gateway/custom_auth_config
 */
export const CustomAuthConfigApi_createCustomAuthConfig = async (
  data: CustomAuthConfigApi_CreateCustomAuthConfigRequestBody,
  options?: HttpOptions
): Promise<CustomAuthConfigApi_CreateCustomAuthConfigResponseBody> =>
  /**! @contract easyops.api.api_gateway.custom_auth_config.CreateCustomAuthConfig@1.4.0 */ (
    await http.post<
      ResponseBodyWrapper<CustomAuthConfigApi_CreateCustomAuthConfigResponseBody>
    >("api/v1/api_gateway/custom_auth_config", data, options)
  ).data;

export interface ModelCustomAuthConfig_partial {
  /** 配置名称 */
  configName: string;

  /** 认证类型 */
  authType: "basicAuth" | "oauth2" | "apiKey";

  /** 认证配置 */
  authConfig: ModelCustomAuthConfig["authConfig"];
}

export interface CustomAuthConfigApi_CreateCustomAuthConfigRequestBody_2 {
  /** 关联的服务ID列表 */
  serviceInstanceIds?: string[];
}

export interface CustomAuthConfigApi_CreateCustomAuthConfigResponseBody_2 {
  /** 关联的服务ID列表 */
  serviceInstanceIds?: string[];
}
