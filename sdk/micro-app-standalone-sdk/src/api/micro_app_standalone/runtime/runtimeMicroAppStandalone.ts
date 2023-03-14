import { http, HttpOptions } from "@next-core/http";
import { ResponseBodyWrapper } from "../../../wrapper.js";

export interface RuntimeApi_RuntimeMicroAppStandaloneResponseBody {
  /** 注入菜单信息 */
  injectMenus?: Record<string, any>[];

  /** 用户配置 */
  userConfig?: Record<string, any>;
}

/**
 * @description 独立小产品Runtime接口
 * @endpoint GET /api/v1/micro_app_standalone/runtime/:appId
 */
export const RuntimeApi_runtimeMicroAppStandalone = async (
  appId: string | number,
  options?: HttpOptions
): Promise<RuntimeApi_RuntimeMicroAppStandaloneResponseBody> =>
  /**! @contract easyops.api.micro_app_standalone.runtime.RuntimeMicroAppStandalone@1.0.1 */ (
    await http.get<
      ResponseBodyWrapper<RuntimeApi_RuntimeMicroAppStandaloneResponseBody>
    >(
      `api/gateway/micro_app_standalone.runtime.RuntimeMicroAppStandalone/api/v1/micro_app_standalone/runtime/${appId}`,
      options
    )
  ).data;
