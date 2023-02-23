import { http, HttpOptions } from "@next-core/http";

/**
 * @description 获取brand_title
 * @endpoint GET /api/v1/brand/title
 */
export const BootstrapStandaloneApi_getBrandTitle = (
  options?: HttpOptions
): Promise<void> =>
  /**! @contract easyops.api.api_gateway.bootstrap_standalone.GetBrandTitle@1.0.0 */ http.get<void>(
    "api/v1/brand/title",
    options
  );
