import { LocationDescriptor } from "history";
import { ThemeType } from "@ant-design/compatible/lib/icon";
import { IconName, IconPrefix } from "@fortawesome/fontawesome-svg-core";

/**
 * 侧边栏菜单配置。
 */
export interface SidebarMenu {
  /** 菜单标题。 */
  title: string;

  /** 菜单标题对应的图标。 */
  icon?: MenuIcon;

  /** 菜单标题对应的链接地址。 */
  link?: LocationDescriptor;

  /** 是否默认折叠。 */
  defaultCollapsed?: boolean;

  /** 菜单项列表。 */
  menuItems: SidebarMenuItem[];

  /**
   * 是否显示关联应用。
   *
   * @deprecated 现在建议通过引用相同的 `menuId` 进行菜单扩展。
   */
  showRelatedApps?: boolean;
}

/**
 * 侧边栏二级菜单配置。
 */
export type SidebarSubMenu = Pick<SidebarMenu, "title" | "icon" | "menuItems">;

/** 侧边栏二级菜单项类型。 */
export type SidebarMenuItemType = "default" | "group" | "subMenu";

/** 侧边栏菜单项配置。 */
export type SidebarMenuItem = SidebarMenuSimpleItem | SidebarMenuGroup;

/** 侧边栏基本菜单项的配置。 */
export interface SidebarMenuSimpleItem {
  /** 菜单项文本。 */
  text: string;

  /** 菜单项对应的系统内地址。 */
  to?: LocationDescriptor;

  /** 菜单项对应的外部链接地址。 */
  href?: string;

  /** 菜单项的图标。 */
  icon?: MenuIcon;

  /** 菜单项链接打开的目标。 */
  target?: string;

  type?: "default";

  /** 高亮菜单项时是否使用精确匹配来对比当前地址和菜单项地址。 */
  exact?: boolean;

  /** 设置额外包含的匹配高亮菜单项的地址列表。 */
  activeIncludes?: string[];

  /** 设置需要被排除的匹配高亮菜单项的地址列表。 */
  activeExcludes?: string[];

  /** 设置匹配高亮菜单项时是否还对 search 参数进行比较。 */
  activeMatchSearch?: boolean;

  /** @internal */
  key?: string;
}

/** 侧边栏分组菜单项的配置。 */
export interface SidebarMenuGroup {
  /** 分组类型。 */
  type: "group" | "subMenu";

  /** 分组标题。 */
  title: string;

  /** {@inheritDoc SidebarMenuSimpleItem.icon } */
  icon?: MenuIcon;

  /** 该分组下的子菜单项列表。 */
  items: SidebarMenuItem[];

  /** @internal */
  key?: string;

  /** 该分组下的子菜单是否默认展开。 */
  defaultExpanded?: boolean;
}

/** 图标配置。 */
export type MenuIcon = AntdIcon | FaIcon | EasyopsIcon;

/** Antd 图标配置。 */
export type AntdIcon = RefinedAntdIcon | LegacyAntdIcon;

/** 优化后的 Antd 图标配置。 */
export interface RefinedAntdIcon {
  lib: "antd";
  icon: string;
  theme?: ThemeType;
  color?: string;
}

/** 历史遗留的 Antd 图标配置。 */
export interface LegacyAntdIcon {
  lib: "antd";
  type: string;
  theme?: ThemeType;
  color?: string;
}

/** FontAwesome 图标配置。 */
export interface FaIcon {
  lib: "fa";
  icon: IconName;
  prefix?: IconPrefix;
  color?: string;
}

/** EasyOps 图标配置。 */
export interface EasyopsIcon {
  lib: "easyops";
  icon: string;
  category?: string;
  color?: string;
}
