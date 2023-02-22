import { http, HttpOptions } from "@next-core/http";
import { ResponseBodyWrapper } from "../../../wrapper.js";

export interface CustomAuthConfigApi_ListCustomAuthConfigRequestParams {
  /** 查询页面 */
  page?: number;

  /** 每页数量 */
  pageSize?: number;

  /** 名字模糊匹配 */
  keyword?: string;

  /** 多个字段用逗号分割(默认返回全部字段) */
  fields?: string;
}

export interface CustomAuthConfigApi_ListCustomAuthConfigResponseBody {
  /** 返回总数 */
  total?: number;

  /** 页数 */
  page?: number;

  /** 该页大小 */
  pageSize?: number;

  /** 认证配置列表 */
  list?: Record<string, any>[];
}

/**
 * @description 获取服务认证配置列表
 * @endpoint GET /api/v1/api_gateway/custom_auth_config
 */
export const CustomAuthConfigApi_listCustomAuthConfig = async (
  params: CustomAuthConfigApi_ListCustomAuthConfigRequestParams,
  options?: HttpOptions
): Promise<CustomAuthConfigApi_ListCustomAuthConfigResponseBody> =>
  /**! @contract easyops.api.api_gateway.custom_auth_config.ListCustomAuthConfig@1.5.0 */ (
    await http.get<
      ResponseBodyWrapper<CustomAuthConfigApi_ListCustomAuthConfigResponseBody>
    >("api/v1/api_gateway/custom_auth_config", { ...options, params })
  ).data;
