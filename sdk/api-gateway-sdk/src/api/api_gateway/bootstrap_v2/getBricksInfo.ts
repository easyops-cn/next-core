import { http, HttpOptions } from "@next-core/http";
import { ResponseBodyWrapper } from "../../../wrapper.js";

export interface BootstrapV2Api_GetBricksInfoRequestParams {
  /** brick数据需要忽略的字段，多个字段用逗号分开 */
  ignoredBrickFields?: string;

  /** template数据需要忽略的字段，多个字段用逗号分开 */
  ignoredTemplateFields?: string;
}

export interface BootstrapV2Api_GetBricksInfoResponseBody {
  /** 相关 NB 构件包信息 */
  bricksInfo?: Record<string, any>[];

  /** 相关 NT 构件包信息 */
  templatesInfo?: Record<string, any>[];
}

/**
 * @description 获取bricks/templates信息
 * @endpoint GET /api/v1/api_gateway/bricks
 */
export const BootstrapV2Api_getBricksInfo = async (
  params: BootstrapV2Api_GetBricksInfoRequestParams,
  options?: HttpOptions
): Promise<BootstrapV2Api_GetBricksInfoResponseBody> =>
  /**! @contract easyops.api.api_gateway.bootstrap_v2.GetBricksInfo@1.0.0 */ (
    await http.get<
      ResponseBodyWrapper<BootstrapV2Api_GetBricksInfoResponseBody>
    >("api/v1/api_gateway/bricks", { ...options, params })
  ).data;
