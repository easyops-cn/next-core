import { http, HttpOptions } from "@next-core/http";
import {
  ModelStoryBoard,
  ModelSettings,
  ModelDesktop,
} from "../../../model/api_gateway/index.js";
import { ResponseBodyWrapper } from "../../../wrapper.js";

export interface BootstrapV2Api_BootstrapV2RequestParams {
  /** 是否需要检查登录态 */
  check_login?: boolean;

  /** storyboard下的app指定，不指定的话默认全部返回,多个字段用逗号分割 */
  appFields?: string;

  /** brick数据需要忽略的字段，多个字段用逗号分开 */
  ignoreBrickFields?: string;

  /** template数据需要忽略的字段，多个字段用逗号分开 */
  ignoreTemplateFields?: string;
}

export interface BootstrapV2Api_BootstrapV2ResponseBody {
  /** ${BRICK_NEXT}/packages/brick-container/conf/navbar.json 的内容 */
  navbar?: Record<string, any>;

  /** ${BRICK_NEXT}/packages/brick-container/conf/storyboards/ *.json 的内容列表 */
  storyboards?: Partial<ModelStoryBoard>[];

  /** ${BRICK_NEXT}/bricks/ * /dist/ 的内容 */
  brickPackages?: Record<string, any>[];

  /** ${BRICK_NEXT}/templates/ * /dist/ 的内容 */
  templatePackages?: Record<string, any>[];

  /** console特性配置 */
  settings?: Partial<ModelSettings>;

  /** 桌面列表 */
  desktops?: Partial<ModelDesktop>[];

  /** 系统地图 */
  siteSort?: BootstrapV2Api_BootstrapV2ResponseBody_siteSort_item[];
}

/**
 * @description 获取系统初始化信息
 * @endpoint GET /api/auth/v2/bootstrap
 */
export const BootstrapV2Api_bootstrapV2 = async (
  params: BootstrapV2Api_BootstrapV2RequestParams,
  options?: HttpOptions
): Promise<BootstrapV2Api_BootstrapV2ResponseBody> =>
  /**! @contract easyops.api.api_gateway.bootstrap_v2.BootstrapV2@1.1.0 */ (
    await http.get<ResponseBodyWrapper<BootstrapV2Api_BootstrapV2ResponseBody>>(
      "api/auth/v2/bootstrap",
      { ...options, params }
    )
  ).data;

export interface BootstrapV2Api_BootstrapV2ResponseBody_siteSort_item {
  /** 分类ID */
  id?: string;

  /** 分类名称 */
  name?: string;

  /** 分类顺序 */
  order?: number;

  /** 微应用列表 */
  apps?: BootstrapV2Api_BootstrapV2ResponseBody_siteSort_item_apps_item[];
}

export interface BootstrapV2Api_BootstrapV2ResponseBody_siteSort_item_apps_item {
  /** 微应用id */
  id?: string;

  /** 微应用排序 */
  sort?: number;
}
