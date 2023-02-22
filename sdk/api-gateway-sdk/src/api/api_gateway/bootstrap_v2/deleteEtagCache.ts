import { http, HttpOptions } from "@next-core/http";

/**
 * @description 删除bootstrapV2的etag缓存
 * @endpoint DELETE /api/delete_bootstrap_etag
 */
export const BootstrapV2Api_deleteEtagCache = (
  options?: HttpOptions
): Promise<void> =>
  /**! @contract easyops.api.api_gateway.bootstrap_v2.DeleteEtagCache@1.0.0 */ http.delete<void>(
    "api/delete_bootstrap_etag",
    options
  );
