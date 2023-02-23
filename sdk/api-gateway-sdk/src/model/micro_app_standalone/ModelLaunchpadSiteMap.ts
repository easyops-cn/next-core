/** Launchpad 站点地图 */
export interface ModelLaunchpadSiteMap {
  /** 分类ID */
  id: string;

  /** 分类名称 */
  name: string;

  /** 分类顺序 */
  order: number;

  /** 微应用列表 */
  apps: ModelLaunchpadSiteMap_apps_item[];
}

export interface ModelLaunchpadSiteMap_apps_item {
  /** 微应用id */
  id?: string;

  /** 微应用排序 */
  sort?: number;
}
