import { http, HttpOptions } from "@next-core/http";
import { ResponseBodyWrapper } from "../../../wrapper.js";

export interface CustomAuthConfigApi_GetCustomAuthConfigRequestParams {
  /** 多个字段用逗号分割(默认返回全部字段) */
  fields?: string;
}

export type CustomAuthConfigApi_GetCustomAuthConfigResponseBody = Record<
  string,
  any
>;

/**
 * @description 获取服务认证配置详情
 * @endpoint GET /api/v1/api_gateway/custom_auth_config/:instanceId
 */
export const CustomAuthConfigApi_getCustomAuthConfig = async (
  instanceId: string | number,
  params: CustomAuthConfigApi_GetCustomAuthConfigRequestParams,
  options?: HttpOptions
): Promise<CustomAuthConfigApi_GetCustomAuthConfigResponseBody> =>
  /**! @contract easyops.api.api_gateway.custom_auth_config.GetCustomAuthConfig@1.5.0 */ (
    await http.get<
      ResponseBodyWrapper<CustomAuthConfigApi_GetCustomAuthConfigResponseBody>
    >(`api/v1/api_gateway/custom_auth_config/${instanceId}`, {
      ...options,
      params,
    })
  ).data;
