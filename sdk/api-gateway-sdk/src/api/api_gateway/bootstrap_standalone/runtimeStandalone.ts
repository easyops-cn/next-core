import { http, HttpOptions } from "@next-core/http";
import { ModelSettings } from "../../../model/api_gateway/index.js";
import { ResponseBodyWrapper } from "../../../wrapper.js";

export interface BootstrapStandaloneApi_RuntimeStandaloneResponseBody {
  /** api_gateway特性配置 */
  settings?: Partial<ModelSettings>;
}

/**
 * @description 独立小产品Runtime接口
 * @endpoint GET /api/v1/runtime_standalone
 */
export const BootstrapStandaloneApi_runtimeStandalone = async (
  options?: HttpOptions
): Promise<BootstrapStandaloneApi_RuntimeStandaloneResponseBody> =>
  /**! @contract easyops.api.api_gateway.bootstrap_standalone.RuntimeStandalone@1.0.1 */ (
    await http.get<
      ResponseBodyWrapper<BootstrapStandaloneApi_RuntimeStandaloneResponseBody>
    >("api/v1/runtime_standalone", options)
  ).data;
