import { http, HttpOptions } from "@next-core/http";
import { ResponseBodyWrapper } from "../../../wrapper.js";

export interface RuntimeApi_SearchMicroAppStandaloneRequestBody {
  /** 查询条件 */
  query?: Record<string, any>;

  /** 返回字段 */
  fields?: string[];
}

export interface RuntimeApi_SearchMicroAppStandaloneResponseBody {
  /** 所有启用的微应用 */
  list?: Record<string, any>[];

  /** 总数 */
  total?: number;
}

/**
 * @description 查询独立部署小产品
 * @endpoint POST /api/v1/micro_app_standalone/search
 */
export const RuntimeApi_searchMicroAppStandalone = async (
  data: RuntimeApi_SearchMicroAppStandaloneRequestBody,
  options?: HttpOptions
): Promise<RuntimeApi_SearchMicroAppStandaloneResponseBody> =>
  /**! @contract easyops.api.micro_app_standalone.runtime.SearchMicroAppStandalone@1.0.1 */ (
    await http.post<
      ResponseBodyWrapper<RuntimeApi_SearchMicroAppStandaloneResponseBody>
    >(
      "api/gateway/micro_app_standalone.runtime.SearchMicroAppStandalone/api/v1/micro_app_standalone/search",
      data,
      options
    )
  ).data;
