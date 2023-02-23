import { http, HttpOptions } from "@next-core/http";

/**
 * @description 删除服务认证配置，如果存在已关联的服务则禁止删除
 * @endpoint DELETE /api/v1/api_gateway/custom_auth_config/:instanceId
 */
export const CustomAuthConfigApi_deleteCustomAuthConfig = (
  instanceId: string | number,
  options?: HttpOptions
): Promise<void> =>
  /**! @contract easyops.api.api_gateway.custom_auth_config.DeleteCustomAuthConfig@1.0.0 */ http.delete<void>(
    `api/v1/api_gateway/custom_auth_config/${instanceId}`,
    options
  );
