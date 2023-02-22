import { http, HttpOptions } from "@next-core/http";

/**
 * @description 获取brand_favicon
 * @endpoint GET /api/v1/brand/favicon
 */
export const BootstrapStandaloneApi_getBrandFavicon = (
  options?: HttpOptions
): Promise<void> =>
  /**! @contract easyops.api.api_gateway.bootstrap_standalone.GetBrandFavicon@1.0.0 */ http.get<void>(
    "api/v1/brand/favicon",
    options
  );
