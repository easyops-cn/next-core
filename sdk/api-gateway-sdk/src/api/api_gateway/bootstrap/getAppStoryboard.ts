import { http, HttpOptions } from "@next-core/http";
import { ModelStoryBoard } from "../../../model/api_gateway/index.js";
import { ResponseBodyWrapper } from "../../../wrapper.js";

export interface BootstrapApi_GetAppStoryboardRequestParams {
  /** 是否需要检查登录态 */
  check_login?: boolean;
}

export type BootstrapApi_GetAppStoryboardResponseBody =
  Partial<ModelStoryBoard>;

/**
 * @description 获取app storyboard初始化信息
 * @endpoint GET /api/auth/bootstrap/:appId
 */
export const BootstrapApi_getAppStoryboard = async (
  appId: string | number,
  params: BootstrapApi_GetAppStoryboardRequestParams,
  options?: HttpOptions
): Promise<BootstrapApi_GetAppStoryboardResponseBody> =>
  /**! @contract easyops.api.api_gateway.bootstrap.GetAppStoryboard@1.0.0 */ (
    await http.get<
      ResponseBodyWrapper<BootstrapApi_GetAppStoryboardResponseBody>
    >(`api/auth/bootstrap/${appId}`, { ...options, params })
  ).data;
