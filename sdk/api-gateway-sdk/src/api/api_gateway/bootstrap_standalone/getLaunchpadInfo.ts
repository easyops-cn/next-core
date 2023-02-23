import { http, HttpOptions } from "@next-core/http";
import {
  ModelLaunchpadSettings,
  ModelLaunchpadDesktop,
  ModelLaunchpadStoryboard,
  ModelLaunchpadSiteMap,
} from "../../../model/micro_app_standalone/index.js";
import { ResponseBodyWrapper } from "../../../wrapper.js";

export interface BootstrapStandaloneApi_GetLaunchpadInfoRequestParams {
  /** 指定查询storyboard下的app字段，不指定则默认返回 appId,name,position,homepage,menuIcon,icons */
  appFields?: string;
}

export interface BootstrapStandaloneApi_GetLaunchpadInfoResponseBody {
  /** 配置 */
  settings?: Partial<ModelLaunchpadSettings>;

  /** 桌面列表 */
  desktops?: Partial<ModelLaunchpadDesktop>[];

  /** storyboards */
  storyboards?: Partial<ModelLaunchpadStoryboard>[];

  /** 系统地图 */
  siteSort?: Partial<ModelLaunchpadSiteMap>[];
}

/**
 * @description 获取Launchpad信息 (透传micro_app_standalone_service的GetLaunchpadInfo接口，并进行accessRule过滤)
 * @endpoint GET /api/v1/micro_app_standalone/launchpad_info
 */
export const BootstrapStandaloneApi_getLaunchpadInfo = async (
  params: BootstrapStandaloneApi_GetLaunchpadInfoRequestParams,
  options?: HttpOptions
): Promise<BootstrapStandaloneApi_GetLaunchpadInfoResponseBody> =>
  /**! @contract easyops.api.api_gateway.bootstrap_standalone.GetLaunchpadInfo@1.1.0 */ (
    await http.get<
      ResponseBodyWrapper<BootstrapStandaloneApi_GetLaunchpadInfoResponseBody>
    >("api/v1/micro_app_standalone/launchpad_info", { ...options, params })
  ).data;
