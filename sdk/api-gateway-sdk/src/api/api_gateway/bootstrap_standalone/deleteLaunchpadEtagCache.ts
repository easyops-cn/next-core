import { http, HttpOptions } from "@next-core/http";

/**
 * @description 删除launchpad的etag缓存
 * @endpoint DELETE /api/v1/launchpad/etag
 */
export const BootstrapStandaloneApi_deleteLaunchpadEtagCache = (
  options?: HttpOptions
): Promise<void> =>
  /**! @contract easyops.api.api_gateway.bootstrap_standalone.DeleteLaunchpadEtagCache@1.0.0 */ http.delete<void>(
    "api/v1/launchpad/etag",
    options
  );
