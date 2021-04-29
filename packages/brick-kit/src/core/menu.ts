import { sortBy } from "lodash";
import {
  MenuIcon,
  SidebarMenuSimpleItem,
  PluginRuntimeContext,
  SidebarMenu,
  ResolveConf,
} from "@next-core/brick-types";
import { isEvaluable, isObject, preevaluate } from "@next-core/brick-utils";
import {
  InstanceApi_postSearch,
  InstanceApi_getDetail,
} from "@next-sdk/cmdb-sdk";
import { computeRealValue } from "../setProperties";
import { looseCheckIfOfComputed } from "../checkIf";
import {
  _internalApiGetCurrentContext,
  _internalApiGetResolver,
  MountRoutesResult,
  Kernel,
} from "./exports";

const symbolAppId = Symbol("appId");

export interface MenuRawData {
  menuId: string;
  title: string;
  app?: [
    {
      appId: string;
    }
  ];
  icon?: MenuIcon;
  link?: string;
  titleDataSource?: TitleDataSource;
  items?: MenuItemRawData[];
  type?: "main" | "inject";
  defaultCollapsed?: boolean;
  dynamicItems?: boolean;
  itemsResolve?: ResolveConf;
}

type MenuItemRawData = Omit<SidebarMenuSimpleItem, "type"> & {
  children?: MenuItemRawData[];
  type?: "default" | "group";
  sort?: number;
  if?: string | boolean;
  defaultExpanded?: boolean;
  [symbolAppId]?: string;
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
  context: PluginRuntimeContext,
  kernel: Kernel
): Promise<void> {
  const hasSubMenu = !!menuBar.subMenuId;
  if (menuBar.menuId) {
    menuBar.menu = await processMenu(
      menuBar.menuId,
      context,
      kernel,
      hasSubMenu
    );
  }
  if (hasSubMenu) {
    menuBar.subMenu = await processMenu(menuBar.subMenuId, context, kernel);
  } else {
    menuBar.subMenu = null;
  }
}

export async function fetchMenuById(menuId: string): Promise<MenuRawData> {
  if (menuCache.has(menuId)) {
    return menuCache.get(menuId);
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
        type: true,
        dynamicItems: true,
        itemsResolve: true,
        items: true,
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
  await Promise.all(menuList.map(loadDynamicMenuItems));
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
    items: menuList.flatMap((menu) =>
      (Array.isArray(menu.items) ? menu.items : []).map((item) => ({
        ...item,
        [symbolAppId]: menu.app[0].appId,
      }))
    ),
  };
}

async function loadDynamicMenuItems(menu: MenuRawData): Promise<void> {
  if (menu.dynamicItems && menu.itemsResolve) {
    const itemsConf: Partial<{ items: MenuItemRawData[] }> = {};
    await _internalApiGetResolver().resolveOne(
      "reference",
      {
        transform: "items",
        transformMapArray: false,
        ...menu.itemsResolve,
      },
      itemsConf,
      null,
      _internalApiGetCurrentContext()
    );
    menu.items = itemsConf.items;
  }
}

async function processMenu(
  menuId: string,
  context: PluginRuntimeContext,
  kernel: Kernel,
  hasSubMenu?: boolean
): Promise<SidebarMenu> {
  const { items, app, ...restMenuData } = await fetchMenuById(menuId);

  const menuData = {
    ...(await computeRealValueWithOverrideApp(
      restMenuData,
      app[0].appId,
      context,
      kernel
    )),
    items: await Promise.all(
      items.map((item) =>
        computeRealValueWithOverrideApp(
          item,
          item[symbolAppId],
          context,
          kernel
        )
      )
    ),
  };

  return {
    title: await processMenuTitle(menuData),
    icon: menuData.icon,
    link: menuData.link,
    menuItems: menuData.items
      ?.filter(
        // `if` is already evaluated.
        looseCheckIfOfComputed
      )
      .map((item) => {
        const children = item.children?.filter(
          // `if` is already evaluated.
          looseCheckIfOfComputed
        ) as SidebarMenuSimpleItem[];
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
          : (item as SidebarMenuSimpleItem);
      }),
    defaultCollapsed: menuData.defaultCollapsed || hasSubMenu,
  };
}

export async function processMenuTitle(menuData: MenuRawData): Promise<string> {
  if (menuData.title || !menuData.titleDataSource) {
    return menuData.title;
  }
  const cacheKey = JSON.stringify(menuData.titleDataSource);
  if (menuTitleCache.has(cacheKey)) {
    return menuTitleCache.get(cacheKey);
  }
  const { objectId, instanceId, attributeId } = menuData.titleDataSource;
  const attr = attributeId ?? "name";
  const instanceData = await InstanceApi_getDetail(objectId, instanceId, {
    fields: attr,
  });
  let title: string;
  if (attributeId === "#showKey" && Array.isArray(instanceData[attr])) {
    const [primary, ...rest] = instanceData[attr];
    title = rest.length > 0 ? `${primary}(${rest.join(",")})` : String(primary);
  } else {
    title = String(instanceData[attr]);
  }
  menuTitleCache.set(cacheKey, title);
  return title;
}

export function clearMenuTitleCache(): void {
  menuTitleCache.clear();
}

export function clearMenuCache(): void {
  menuCache.clear();
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

const overriddenGlobals = ["APP", "I18N"];

/**
 * If the menu contains evaluations which use `APP` or `I18N`,
 * we have to override app in context when computing real values.
 */
function requireOverrideApp(data: unknown, memo = new WeakSet()): boolean {
  if (typeof data === "string") {
    if (isEvaluable(data)) {
      if (overriddenGlobals.some((key) => data.includes(key))) {
        const { attemptToVisitGlobals } = preevaluate(data);
        return overriddenGlobals.some((key) => attemptToVisitGlobals.has(key));
      }
    } else {
      return /\${\s*APP\s*\./.test(data);
    }
  } else if (isObject(data)) {
    // Avoid call stack overflow.
    // istanbul ignore next
    if (memo.has(data)) {
      return false;
    }
    memo.add(data);
    return (Array.isArray(data) ? data : Object.values(data)).some((item) =>
      requireOverrideApp(item, memo)
    );
  }

  return false;
}

async function computeRealValueWithOverrideApp<T>(
  data: T,
  overrideAppId: string,
  context: PluginRuntimeContext,
  kernel: Kernel
): Promise<T> {
  let newContext = context;
  if (overrideAppId !== context.app.id && requireOverrideApp(data)) {
    const storyboard = kernel.bootstrapData.storyboards.find(
      (story) => story.app.id === overrideAppId
    );
    if (storyboard) {
      await kernel.fulfilStoryboard(storyboard);
      newContext = {
        ...context,
        overrideApp: storyboard.app,
      };
    }
  }
  return computeRealValue(data, newContext, true) as T;
}
