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

export type SidebarMenuItemType = "default" | "group" | "subMenu";

export type SidebarMenuItem = SidebarMenuSimpleItem | SidebarMenuGroup;

export interface SidebarMenuSimpleItem {
  text: string;
  to: LocationDescriptor;
  icon?: MenuIcon;
  target?: string;
  type?: "default";
  exact?: boolean;
  activeIncludes?: string[];
  activeExcludes?: string[];
  key?: string;
}

export interface SidebarMenuGroup {
  type: "group" | "subMenu";
  title: string;
  items: SidebarMenuItem[];
  key?: string;
}

export type MenuIcon = AntdIcon | FaIcon | EasyopsIcon;

export interface AntdIcon {
  lib: "antd";
  type: string;
  theme?: ThemeType;
}

export interface FaIcon {
  lib: "fa";
  icon: IconName;
  prefix?: IconPrefix;
}

export interface EasyopsIcon {
  lib: "easyops";
  icon: string;
  category?: string;
}
