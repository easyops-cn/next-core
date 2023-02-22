import { http, HttpOptions } from "@next-core/http";
import { ModelCustomAuthConfig } from "../../../model/api_gateway/index.js";
import { ResponseBodyWrapper } from "../../../wrapper.js";

export type CustomAuthConfigApi_UpdateCustomAuthConfigRequestBody =
  Partial<ModelCustomAuthConfig> &
    ModelCustomAuthConfig_partial_2 &
    CustomAuthConfigApi_UpdateCustomAuthConfigRequestBody_2;

export type CustomAuthConfigApi_UpdateCustomAuthConfigResponseBody =
  Partial<ModelCustomAuthConfig> &
    CustomAuthConfigApi_UpdateCustomAuthConfigResponseBody_2;

/**
 * @description 更新服务认证配置
 * @endpoint PUT /api/v1/api_gateway/custom_auth_config/:instanceId
 */
export const CustomAuthConfigApi_updateCustomAuthConfig = async (
  instanceId: string | number,
  data: CustomAuthConfigApi_UpdateCustomAuthConfigRequestBody,
  options?: HttpOptions
): Promise<CustomAuthConfigApi_UpdateCustomAuthConfigResponseBody> =>
  /**! @contract easyops.api.api_gateway.custom_auth_config.UpdateCustomAuthConfig@1.3.0 */ (
    await http.put<
      ResponseBodyWrapper<CustomAuthConfigApi_UpdateCustomAuthConfigResponseBody>
    >(`api/v1/api_gateway/custom_auth_config/${instanceId}`, data, options)
  ).data;

export interface ModelCustomAuthConfig_partial_2 {
  /** 实例ID */
  instanceId: string;

  /** 配置名称 */
  configName: string;

  /** 认证类型 */
  authType: "basicAuth" | "oauth2" | "apiKey";

  /** 认证配置 */
  authConfig: ModelCustomAuthConfig["authConfig"];
}

export interface CustomAuthConfigApi_UpdateCustomAuthConfigRequestBody_2 {
  /** 关联的服务ID列表 */
  serviceInstanceIds?: string[];
}

export interface CustomAuthConfigApi_UpdateCustomAuthConfigResponseBody_2 {
  /** 关联的服务ID列表 */
  serviceInstanceIds?: string[];
}
