import { sortBy } from "lodash";
import {
  MenuIcon,
  SidebarMenuSimpleItem,
  PluginRuntimeContext,
  SidebarMenu,
} from "@easyops/brick-types";
import { InstanceApi } from "@sdk/cmdb-sdk";
import { MountRoutesResult } from "./LocationContext";
import { computeRealValue } from "../setProperties";

export interface MenuRawData {
  menuId: string;
  title: string;
  icon?: MenuIcon;
  link?: string;
  titleDataSource?: TitleDataSource;
  items?: MenuItemRawData[];
  type?: "main" | "inject";
  defaultCollapsed?: boolean;
}

type MenuItemRawData = Omit<SidebarMenuSimpleItem, "type"> & {
  children?: SidebarMenuSimpleItem[];
  type?: "default" | "group";
  sort?: number;
};

interface TitleDataSource {
  objectId: string;
  instanceId: string;
  attributeId?: string;
}

// Caching menu requests to avoid flicker.
const menuCache = new Map<string, MenuRawData>();
const menuTitleCache = new Map<string, string>();

export async function constructMenu(
  menuBar: MountRoutesResult["menuBar"],
  context: PluginRuntimeContext
): Promise<void> {
  const hasSubMenu = !!menuBar.subMenuId;
  if (menuBar.menuId) {
    menuBar.menu = await processMenu(menuBar.menuId, context, hasSubMenu);
  }
  if (hasSubMenu) {
    menuBar.subMenu = await processMenu(menuBar.subMenuId, context);
  } else {
    menuBar.subMenu = null;
  }
}

export async function fetchMenuById(menuId: string): Promise<MenuRawData> {
  if (menuCache.has(menuId)) {
    return menuCache.get(menuId);
  }
  const menuList = (
    await InstanceApi.postSearch("EASYOPS_STORYBOARD_MENU", {
      page: 1,
      page_size: 200,
      fields: {
        menuId: true,
        title: true,
        icon: true,
        link: true,
        titleDataSource: true,
        defaultCollapsed: true,
        type: true,
        items: true,
        "items.children": true,
      },
      query: {
        menuId: {
          $eq: menuId,
        },
      },
    })
  ).list as MenuRawData[];
  const menuData = mergeMenu(menuList);
  if (!menuData) {
    throw new Error(`Menu not found: ${menuId}`);
  }
  reorderMenuItems(menuData);
  menuCache.set(menuId, menuData);
  return menuData;
}

function mergeMenu(menuList: MenuRawData[]): MenuRawData {
  const mainMenu = menuList.find((menu) => menu.type !== "inject");
  if (!mainMenu) {
    return undefined;
  }
  return {
    ...mainMenu,
    items: menuList.flatMap((menu) => menu.items ?? []),
  };
}

async function processMenu(
  menuId: string,
  context: PluginRuntimeContext,
  hasSubMenu?: boolean
): Promise<SidebarMenu> {
  const menuData = (await computeRealValue(
    await fetchMenuById(menuId),
    context,
    true
  )) as MenuRawData;
  return {
    title: await processMenuTitle(menuData, menuId),
    icon: menuData.icon,
    link: menuData.link,
    menuItems: menuData.items?.map((item) =>
      item.type === "group"
        ? {
            type: "group",
            title: item.text,
            items: item.children,
          }
        : item.children?.length
        ? {
            type: "subMenu",
            title: item.text,
            icon: item.icon,
            items: item.children,
          }
        : (item as SidebarMenuSimpleItem)
    ),
    defaultCollapsed: menuData.defaultCollapsed || hasSubMenu,
  };
}

export async function processMenuTitle(
  menuData: MenuRawData,
  menuId: string
): Promise<string> {
  if (menuData.title || !menuData.titleDataSource) {
    return menuData.title;
  }
  if (menuTitleCache.has(menuId)) {
    return menuTitleCache.get(menuId);
  }
  const { objectId, instanceId, attributeId } = menuData.titleDataSource;
  const attr = attributeId ?? "name";
  const instanceData = await InstanceApi.getDetail(objectId, instanceId, {
    fields: attr,
  });
  const title = String(instanceData[attr]);
  menuTitleCache.set(menuId, title);
  return title;
}

function reorderMenuItems(menuData: MenuRawData): void {
  menuData.items = sortMenuItems(menuData.items).map((item) => ({
    ...item,
    children: sortMenuItems(item.children) as SidebarMenuSimpleItem[],
  }));
}

function sortMenuItems(list: MenuItemRawData[]): MenuItemRawData[] {
  return sortBy(list, (item) => item.sort ?? -Infinity);
}
