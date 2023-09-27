import type { MetaI18n, MicroApp, ResolveConf } from "@next-core/types";
import type {
  RuntimeHooksMenuHelpers,
  __secret_internals,
} from "@next-core/runtime";
import {
  symbolAppId,
  symbolMenuI18nNamespace,
  symbolOverrideApp,
} from "./constants.js";

export type RuntimeContext = __secret_internals.RuntimeContext;

export type RuntimeHelpers = RuntimeHooksMenuHelpers;

/** 原始菜单数据。 */
export interface MenuRawData {
  menuId: string;
  title: string;
  app: [
    {
      appId: string;
    },
  ];
  icon?: unknown;
  link?: string;
  titleDataSource?: TitleDataSource;
  items?: MenuItemRawData[];
  type?: "main" | "inject";
  injectMenuGroupId?: string;
  defaultCollapsed?: boolean;
  defaultCollapsedBreakpoint?: number;
  dynamicItems?: boolean;
  itemsResolve?: ResolveConf;
  i18n?: MetaI18n;
  overrideApp?: MicroApp;
}

/** 原始菜单项数据。 */
export type MenuItemRawData = Omit<SidebarMenuSimpleItem, "type"> & {
  children?: MenuItemRawData[];
  type?: "default" | "group";
  childLayout?: "default" | "category" | "siteMap";
  sort?: number;
  if?: string | boolean;
  defaultExpanded?: boolean;
  groupId?: string;
  groupFrom?: string;
};

interface TitleDataSource {
  objectId: string;
  instanceId: string;
  attributeId?: string;
}

/** 侧边栏基本菜单项的配置。 */
export interface SidebarMenuSimpleItem {
  /** 菜单项文本。 */
  text: string;

  /** 菜单项对应的系统内地址。 */
  // to?: LocationDescriptor;
  to?: unknown;

  /** 菜单项对应的外部链接地址。 */
  href?: string;

  /** 菜单项的图标。 */
  // icon?: MenuIcon;
  icon?: unknown;

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

export interface RuntimeMenuItemRawData extends MenuItemRawData {
  children?: RuntimeMenuItemRawData[];
  [symbolAppId]: string;
  [symbolMenuI18nNamespace]?: string;
  [symbolOverrideApp]?: MicroApp;
}

export interface RuntimeMenuRawData extends MenuRawData {
  items: RuntimeMenuItemRawData[];
  // [symbolShouldCache]?: boolean;
  [symbolMenuI18nNamespace]?: string;
  [symbolOverrideApp]?: MicroApp;
}

export interface SidebarMenu {
  /** 菜单标题。 */
  title: string;
  /** 菜单标题对应的图标。 */
  icon?: unknown;
  /** 菜单标题对应的链接地址。 */
  link?: unknown;
  /** 是否默认折叠。 */
  defaultCollapsed?: boolean;
  /** 针对小于特定尺寸的屏幕（例如 1600px），是否默认折叠。 */
  defaultCollapsedBreakpoint?: number;
  /** 菜单项列表。 */
  menuItems: SidebarMenuItem[];
}

/** 侧边栏菜单项配置。 */
export type SidebarMenuItem = SidebarMenuSimpleItem | SidebarMenuGroup;

/** 侧边栏分组菜单项的配置。 */
export interface SidebarMenuGroup {
  /** 分组 Id。 */
  groupId?: string;

  /** 分组来源。 */
  groupFrom?: string;

  /** 分组类型。 */
  type: "group" | "subMenu";

  /** 分组标题。 */
  title: string;

  /** {@inheritDoc SidebarMenuSimpleItem.icon } */
  icon?: unknown;

  /** 该分组下的子菜单项列表。 */
  items?: SidebarMenuItem[];

  /** @internal */
  key?: string;

  /** 该分组下的子菜单是否默认展开。 */
  defaultExpanded?: boolean;

  /** 子菜单项的布局方式。 */
  childLayout?: "default" | "category" | "siteMap";
}
