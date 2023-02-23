import { ModelInstalledMicroApp } from "./index.js";

/** 小产品 */
export interface ModelInstalledMicroAppBootstrap {
  /** 小产品名称 */
  name: string;

  /** 小产品图标图标url */
  icons: ModelInstalledMicroApp["icons"];

  /** 小产品配置 */
  storyboardJson: string;

  /** 标签 */
  tags: string[];

  /** NA程序包当前版本 */
  currentVersion: string;

  /** 安装状态， ok-成功, running-正在安装 */
  installStatus: "ok" | "running";

  /** 小产品首页 */
  homepage: string;

  /** 克隆对象 */
  clonedFrom: ModelInstalledMicroApp["clonedFrom"];

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

  /** 菜单中显示的图标 */
  menuIcon: ModelInstalledMicroApp["menuIcon"];

  /** 图标背景 */
  iconBackground: string;

  /** 默认配置 */
  defaultConfig: string;

  /** 用户配置 */
  userConfig: string;

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

  /** 是否独立部署 */
  standaloneMode: boolean;

  /** 小产品id */
  id: string;

  /** 表示该应用是内部的，不出现在 launchpad 和 app store 中 */
  internal: boolean;

  /** 私有安装应用, true or false */
  private: boolean;

  /** 将console以iframe嵌入 */
  legacy: string;
}
