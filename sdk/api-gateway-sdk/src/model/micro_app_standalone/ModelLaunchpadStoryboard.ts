import {
  ModelInstalledMicroAppIcon,
  ModelInstalledMicroAppMenuIcon,
} from "../micro_app/index.js";

/** Launchpad Storyboard信息 */
export interface ModelLaunchpadStoryboard {
  /** 小产品 */
  app: ModelLaunchpadStoryboard_app;
}

export interface ModelLaunchpadStoryboard_app {
  /** 小产品id */
  id?: string;

  /** 表示该应用是内部的，不出现在 launchpad 和 app store 中 */
  internal?: boolean;

  /** 小产品名称 */
  name?: string;

  /** 小产品图标图标url */
  icons?: Partial<ModelInstalledMicroAppIcon>;

  /** NA程序包当前版本 */
  currentVersion?: string;

  /** 安装状态， ok-成功, running-正在安装 */
  installStatus?: string;

  /** 小产品首页 */
  homepage?: string;

  /** 状态 */
  status?: string;

  /** 菜单中显示的图标 */
  menuIcon?: Partial<ModelInstalledMicroAppMenuIcon>;

  /** 图标背景 */
  iconBackground?: string;

  /** 是否来自buildPsh方式 */
  isBuildPush?: boolean;

  /** 是否独立部署 */
  standaloneMode?: boolean;

  /** locales */
  locales?: Record<string, any>;
}
