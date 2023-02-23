import {
  ModelInstalledMicroAppIcon,
  ModelInstalledMicroAppClonedFrom,
  ModelInstalledMicroAppMenuIcon,
} from "./index.js";

/** 小产品 */
export interface ModelInstalledMicroApp {
  /** cmdb唯一标识, 业务逻辑请使用appId作为唯一标识 */
  instanceId: string;

  /** 小产品名称 */
  name: string;

  /** 小产品id */
  appId: string;

  /** 小产品图标图标url */
  icons: Partial<ModelInstalledMicroAppIcon>;

  /** 小产品配置 */
  storyboardJson: string;

  /** 标签 */
  tags: string[];

  /** NA程序包当前版本 */
  currentVersion: string;

  /** 小产品在应用商店的版本号 */
  appVersion: string;

  /** 安装状态， ok-成功, running-正在安装 */
  installStatus: "ok" | "running";

  /** 小产品首页 */
  homepage: string;

  /** 表示该应用是内部的，不出现在 launchpad 和 app store 中 */
  internal: "true" | "false";

  /** 私有安装应用, true or false */
  private: "true" | "false";

  /** 克隆对象 */
  clonedFrom: Partial<ModelInstalledMicroAppClonedFrom>;

  /** 作者 */
  owner: string;

  /** readme */
  readme: string;

  /** 状态 */
  status: "enabled" | "disabled" | "developing";

  /** 创建时间 */
  ctime: string;

  /** 修改时间 */
  mtime: string;

  /** 关联程序包名称 */
  pkgName: string;

  /** 图标背景 */
  iconBackground: string;

  /** 菜单中显示的图标 */
  menuIcon: Partial<ModelInstalledMicroAppMenuIcon>;

  /** 默认配置 */
  defaultConfig: string;

  /** 用户配置 */
  userConfig: string;

  /** DependsAll */
  dependsAll: boolean;

  /** Legacy */
  legacy: string;

  /** 元数据定义 */
  meta: string;

  /** 路由定义 */
  routes: string;

  /** 环境配置定义 */
  env: any;

  /** locales */
  locales: any;

  /** 可见性等级 */
  visibility: "internal" | "public";

  /** 布局类型 */
  layoutType: string;

  /** 是否来自buildPsh方式 */
  isBuildPush: boolean;

  /** 免登录 */
  noAuthGuard: boolean;

  /** 默认面包屑配置 */
  breadcrumb: string;

  /** 使用主题 */
  theme: string;

  /** 微应用在容器中的排序 */
  position: number;

  /** 默认容器 */
  defaultContainer: ModelInstalledMicroApp_defaultContainer;

  /** 容器类型(默认容器/个性化容器) */
  containerType: string;

  /** 是否独立部署 */
  standaloneMode: boolean;
}

export interface ModelInstalledMicroApp_defaultContainer {
  /** 容器id */
  id?: string;

  /** 容器name */
  name?: string;

  /** 容器类型 */
  type?: "desktop" | "dir";

  /** 排序 */
  order?: number;
}
