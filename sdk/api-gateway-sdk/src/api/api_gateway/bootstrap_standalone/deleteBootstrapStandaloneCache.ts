import { http, HttpOptions } from "@next-core/http";

export interface BootstrapStandaloneApi_DeleteBootstrapStandaloneCacheRequestParams {
  /** 主页 */
  homePage?: string;
}

/**
 * @description 删除独立小产品主页缓存
 * @endpoint DELETE /api/v1/bootstrap_standalone_cache
 */
export const BootstrapStandaloneApi_deleteBootstrapStandaloneCache = (
  params: BootstrapStandaloneApi_DeleteBootstrapStandaloneCacheRequestParams,
  options?: HttpOptions
): Promise<void> =>
  /**! @contract easyops.api.api_gateway.bootstrap_standalone.DeleteBootstrapStandaloneCache@1.0.0 */ http.delete<void>(
    "api/v1/bootstrap_standalone_cache",
    { ...options, params }
  );
