import { LocationDescriptor } from "history";
import { ThemeType } from "antd/lib/icon";
import { IconName, IconPrefix } from "@fortawesome/fontawesome-svg-core";

export interface SidebarMenu {
  title: string;
  icon?: MenuIcon;
  link?: LocationDescriptor;
  defaultCollapsed?: boolean;
  menuItems: SidebarMenuItem[];
  showRelatedApps?: boolean;
}

export type SidebarSubMenu = Pick<SidebarMenu, "title" | "icon" | "menuItems">;

export type SidebarMenuItemType = "default" | "group" | "subMenu";

export type SidebarMenuItem = SidebarMenuSimpleItem | SidebarMenuGroup;

export interface SidebarMenuSimpleItem {
  text: string;
  to?: LocationDescriptor;
  href?: string;
  icon?: MenuIcon;
  target?: string;
  type?: "default";
  exact?: boolean;
  activeIncludes?: string[];
  activeExcludes?: string[];
  activeMatchSearch?: boolean;
  key?: string;
}

export interface SidebarMenuGroup {
  type: "group" | "subMenu";
  title: string;
  icon?: MenuIcon;
  items: SidebarMenuItem[];
  key?: string;
  defaultExpanded?: boolean;
}

export type MenuIcon = AntdIcon | FaIcon | EasyopsIcon;

export type AntdIcon = RefinedAntdIcon | LegacyAntdIcon;

export interface RefinedAntdIcon {
  lib: "antd";
  icon: string;
  theme?: ThemeType;
  color?: string;
}

//兼容老的类型
export interface LegacyAntdIcon {
  lib: "antd";
  type: string;
  theme?: ThemeType;
  color?: string;
}

export interface FaIcon {
  lib: "fa";
  icon: IconName;
  prefix?: IconPrefix;
  color?: string;
}

export interface EasyopsIcon {
  lib: "easyops";
  icon: string;
  category?: string;
  color?: string;
}
