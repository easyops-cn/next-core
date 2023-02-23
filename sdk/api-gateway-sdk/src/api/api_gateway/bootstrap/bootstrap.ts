import { http, HttpOptions } from "@next-core/http";
import {
  ModelStoryBoard,
  ModelSettings,
  ModelDesktop,
} from "../../../model/api_gateway/index.js";
import { ResponseBodyWrapper } from "../../../wrapper.js";

export interface BootstrapApi_BootstrapRequestParams {
  /** 是否需要检查登录态 */
  check_login?: boolean;

  /** 是否只拉取app信息，如果为true， routes等信息不被返回 */
  brief?: boolean;
}

export interface BootstrapApi_BootstrapResponseBody {
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
  siteSort?: BootstrapApi_BootstrapResponseBody_siteSort_item[];
}

/**
 * @description 获取系统初始化信息
 * @endpoint GET /api/auth/bootstrap
 */
export const BootstrapApi_bootstrap = async (
  params: BootstrapApi_BootstrapRequestParams,
  options?: HttpOptions
): Promise<BootstrapApi_BootstrapResponseBody> =>
  /**! @contract easyops.api.api_gateway.bootstrap.Bootstrap@1.1.0 */ (
    await http.get<ResponseBodyWrapper<BootstrapApi_BootstrapResponseBody>>(
      "api/auth/bootstrap",
      { ...options, params }
    )
  ).data;

export interface BootstrapApi_BootstrapResponseBody_siteSort_item {
  /** 分类ID */
  id?: string;

  /** 分类名称 */
  name?: string;

  /** 分类顺序 */
  order?: number;

  /** 微应用列表 */
  apps?: BootstrapApi_BootstrapResponseBody_siteSort_item_apps_item[];
}

export interface BootstrapApi_BootstrapResponseBody_siteSort_item_apps_item {
  /** 微应用id */
  id?: string;

  /** 微应用排序 */
  sort?: number;
}
