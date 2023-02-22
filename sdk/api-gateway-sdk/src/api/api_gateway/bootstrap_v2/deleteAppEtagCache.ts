import { http, HttpOptions } from "@next-core/http";

export interface BootstrapV2Api_DeleteAppEtagCacheRequestParams {
  /** 小产品id，多个用逗号分割 */
  appIds?: string;
}

/**
 * @description 删除具体bootstrapV2的etag缓存
 * @endpoint DELETE /api/delete_app_bootstrap_etag
 */
export const BootstrapV2Api_deleteAppEtagCache = (
  params: BootstrapV2Api_DeleteAppEtagCacheRequestParams,
  options?: HttpOptions
): Promise<void> =>
  /**! @contract easyops.api.api_gateway.bootstrap_v2.DeleteAppEtagCache@1.0.0 */ http.delete<void>(
    "api/delete_app_bootstrap_etag",
    { ...options, params }
  );
