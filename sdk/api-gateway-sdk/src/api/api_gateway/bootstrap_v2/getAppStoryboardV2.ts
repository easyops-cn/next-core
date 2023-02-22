import { http, HttpOptions } from "@next-core/http";
import { ModelStoryBoard } from "../../../model/api_gateway/index.js";
import { ResponseBodyWrapper } from "../../../wrapper.js";

export interface BootstrapV2Api_GetAppStoryboardV2RequestParams {
  /** 需要返回的字段，多个字段用逗号分割 */
  appFields?: string;

  /** 是否需要检查登录态 */
  check_login?: boolean;
}

export type BootstrapV2Api_GetAppStoryboardV2ResponseBody =
  Partial<ModelStoryBoard>;

/**
 * @description 获取app storyboard初始化信息
 * @endpoint GET /api/auth/v2/bootstrap/:appId
 */
export const BootstrapV2Api_getAppStoryboardV2 = async (
  appId: string | number,
  params: BootstrapV2Api_GetAppStoryboardV2RequestParams,
  options?: HttpOptions
): Promise<BootstrapV2Api_GetAppStoryboardV2ResponseBody> =>
  /**! @contract easyops.api.api_gateway.bootstrap_v2.GetAppStoryboardV2@1.0.0 */ (
    await http.get<
      ResponseBodyWrapper<BootstrapV2Api_GetAppStoryboardV2ResponseBody>
    >(`api/auth/v2/bootstrap/${appId}`, { ...options, params })
  ).data;
