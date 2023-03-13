import { InstanceApi_postSearch } from "@next-api-sdk/cmdb-sdk";
import { pick } from "lodash";
import { mergeMenu } from "./mergeMenu.js";
import { reorderMenuItems } from "./reorderMenuItems.js";
import { preCheckPermissionsForAny } from "../checkPermissions.js";
import type { RuntimeContext } from "../interfaces.js";
import type { MenuRawData } from "./interfaces.js";
import { checkIfOfComputed } from "../compute/checkIf.js";
import { computeMenuItems, computeMenuData } from "./computeMenuData.js";
import { fetchMenuTitle } from "./fetchMenuTitle.js";

const menuPromises = new Map<string, Promise<void>>();

const menuCache = new Map<string, unknown>();

export function getMenuById(menuId: string) {
  return menuCache.get(menuId);
}

export function fetchMenuById(menuId: string, runtimeContext: RuntimeContext) {
  let promise = menuPromises.get(menuId);
  if (!promise) {
    promise = _fetchMenuById(menuId, runtimeContext);
  }
  return promise;
}

async function _fetchMenuById(menuId: string, runtimeContext: RuntimeContext) {
  if (window.STANDALONE_MICRO_APPS) {
    throw new Error("Fetch menu in standalone micro-apps is not supported yet");
  }

  const menuList = (
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
  ).list as MenuRawData[];

  const menuData = await mergeMenu(menuList, runtimeContext);
  if (!menuData) {
    throw new Error(`Menu not found: ${menuId}`);
  }

  reorderMenuItems(menuData);

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
  const rootAppId = app[0].appId;

  const [computedMenuTitle, computedMenuData, computedMenuItems] =
    await Promise.all([
      fetchMenuTitle(restMenuData),
      computeMenuData(restMenuData, rootAppId, newRuntimeContext),
      computeMenuItems(items, newRuntimeContext),
    ]);

  const finalMenuData = {
    title: computedMenuTitle,
    ...pick(computedMenuData, [
      "icon",
      "link",
      "defaultCollapsed",
      "defaultCollapsedBreakpoint",
    ]),
    menuItems: computedMenuItems.filter(checkIfOfComputed).map((item) => {
      const children = item.children?.filter(checkIfOfComputed);
      return item.type === "group"
        ? {
            type: "group",
            title: item.text,
            items: children,
          }
        : children?.length
        ? {
            type: "subMenu",
            title: item.text,
            icon: item.icon,
            items: children,
            defaultExpanded: item.defaultExpanded,
          }
        : item;
    }),
  };

  // Todo(steve): reconsider the menu cache strategy
  menuCache.set(menuId, finalMenuData);
}
