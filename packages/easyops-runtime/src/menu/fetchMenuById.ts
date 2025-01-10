import { InstanceApi_postSearch } from "@next-api-sdk/cmdb-sdk";
import { InstalledMicroAppApi_getMenusInfo } from "@next-api-sdk/micro-app-sdk";
import { omit, pick } from "lodash";
import { checkIfOfComputed } from "@next-core/runtime";
import { mergeMenu } from "./mergeMenu.js";
import { reorderMenu } from "./reorderMenuItems.js";
import type {
  MenuRawData,
  RuntimeContext,
  RuntimeHelpers,
  RuntimeMenuItemRawData,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuSimpleItem,
} from "./interfaces.js";
import { computeMenuItems, computeMenuData } from "./computeMenuData.js";
import { fetchMenuTitle } from "./fetchMenuTitle.js";
import { getMenusOfStandaloneApp } from "./getMenusOfStandaloneApp.js";
import { preCheckPermissionsForAny } from "../checkPermissions.js";
import { isBlockedHref, isBlockedUrl } from "../auth.js";

const menuPromises = new Map<string, Promise<void>>();

const menuCache = new Map<string, SidebarMenu>();

function transformMenuItems(
  menuItems: RuntimeMenuItemRawData[] | undefined
): SidebarMenuItem[] | undefined {
  return menuItems
    ?.filter(checkIfOfComputed)
    .map((item) => {
      const children = transformMenuItems(item.children);
      const transformedMenuItem: SidebarMenuItem | null =
        item.type === "group"
          ? {
              type: "group",
              title: item.text,
              childLayout: item.childLayout,
              items: children,
              groupId: item.groupId,
              groupFrom: item.groupFrom,
            }
          : children?.length
            ? {
                type: "subMenu",
                childLayout: item.childLayout,
                title: item.text,
                icon: item.icon,
                items: children,
                defaultExpanded: item.defaultExpanded,
              }
            : isMenuItemBlocked(item as SidebarMenuSimpleItem)
              ? null
              : (omit(item, ["type", "items", "children"]) as SidebarMenuItem);
      return transformedMenuItem;
    })
    .filter(Boolean) as SidebarMenuItem[];
}

function isMenuItemBlocked(item: SidebarMenuSimpleItem) {
  return item.href
    ? isBlockedHref(item.href)
    : item.to
      ? isBlockedUrl(item.to)
      : false;
}

export function getMenuById(menuId: string) {
  return menuCache.get(menuId);
}

export function fetchMenuById(
  menuId: string,
  runtimeContext: RuntimeContext,
  helpers: RuntimeHelpers
) {
  let promise = menuPromises.get(menuId);
  if (!promise) {
    promise = _fetchMenuById(menuId, runtimeContext, helpers);
  }
  return promise;
}

async function _fetchMenuById(
  menuId: string,
  runtimeContext: RuntimeContext,
  helpers: RuntimeHelpers
) {
  const menuList = window.STANDALONE_MICRO_APPS
    ? getMenusOfStandaloneApp(menuId, runtimeContext.app.id, helpers)
    : runtimeContext.flags["three-level-menu-layout"]
      ? ((
          await InstalledMicroAppApi_getMenusInfo(menuId, {
            menuObjectId: "EASYOPS_STORYBOARD_MENU",
          })
        ).menus as MenuRawData[])
      : ((
          await InstanceApi_postSearch("EASYOPS_STORYBOARD_MENU", {
            page: 1,
            page_size: 200,
            fields: {
              menuId: true,
              title: true,
              icon: true,
              link: true,
              titleDataSource: true,
              defaultCollapsed: true,
              defaultCollapsedBreakpoint: true,
              type: true,
              injectMenuGroupId: true,
              dynamicItems: true,
              itemsResolve: true,
              items: true,
              i18n: true,
              "items.children": true,
              "app.appId": true,
            },
            query: {
              menuId: {
                $eq: menuId,
              },
              app: {
                $size: {
                  $gt: 0,
                },
              },
            },
          })
        ).list as MenuRawData[]);

  const menuData = await mergeMenu(menuList, runtimeContext, helpers);
  if (!menuData) {
    throw new Error(`Menu not found: ${menuId}`);
  }

  reorderMenu(menuData);

  const { items, app, ...restMenuData } = menuData;
  const newRuntimeContext: RuntimeContext = {
    ...runtimeContext,
    pendingPermissionsPreCheck: [
      ...runtimeContext.pendingPermissionsPreCheck,
      preCheckPermissionsForAny([items, restMenuData]),
    ],
  };
  delete newRuntimeContext.tplStateStoreId;
  delete newRuntimeContext.forEachItem;
  delete newRuntimeContext.forEachIndex;
  delete newRuntimeContext.forEachSize;
  const rootAppId = app[0].appId;

  const [computedMenuData, computedMenuItems] = await Promise.all([
    computeMenuData(restMenuData, rootAppId, newRuntimeContext, helpers),
    computeMenuItems(items, newRuntimeContext, helpers),
  ]);

  const finalMenuData: SidebarMenu = {
    title: await fetchMenuTitle(computedMenuData),
    ...pick(computedMenuData, [
      "icon",
      "link",
      "defaultCollapsed",
      "defaultCollapsedBreakpoint",
    ]),
    menuItems: transformMenuItems(computedMenuItems)!,
  };

  // Todo(steve): reconsider the menu cache strategy
  menuCache.set(menuId, finalMenuData);
}
