import { LocationDescriptor } from "history";
import { ThemeType } from "antd/lib/icon";
import { IconProp } from "@fortawesome/fontawesome-svg-core";

export interface SidebarMenu {
  title: string;
  icon?: MenuIcon;
  link?: LocationDescriptor;
  defaultCollapsed?: boolean;
  menuItems: SidebarMenuItem[];
  showRelatedApps?: boolean;
}

export type SidebarMenuItemType = "default" | "group";

export type SidebarMenuItem = SidebarMenuSimpleItem | SidebarMenuGroup;

export interface SidebarMenuSimpleItem {
  text: string;
  to: LocationDescriptor;
  icon?: MenuIcon;
  type?: "default";
  exact?: boolean;
  activeIncludes?: string[];
  activeExcludes?: string[];
  key?: string;
}

export interface SidebarMenuGroup {
  type: "group";
  title: string;
  items: SidebarMenuSimpleItem[];
  key?: string;
}

export type MenuIcon = AntdIcon | FaIcon;

export interface AntdIcon {
  lib: "antd";
  type: string;
  theme?: ThemeType;
}

export interface FaIcon {
  lib: "fa";
  icon: IconProp;
}
