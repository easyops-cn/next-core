import { isEmpty, isNil, sortBy } from "lodash";
import {
  SidebarMenuSimpleItem,
  PluginRuntimeContext,
  SidebarMenu,
  MenuRawData,
  MenuItemRawData,
} from "@next-core/brick-types";
import { isEvaluable, isObject, preevaluate } from "@next-core/brick-utils";
import {
  InstanceApi_postSearch,
  InstanceApi_getDetail,
} from "@next-sdk/cmdb-sdk";
import { computeRealValue } from "./setProperties";
import { looseCheckIfOfComputed } from "../checkIf";
import {
  _internalApiGetCurrentContext,
  _internalApiGetResolver,
  MountRoutesResult,
  Kernel,
} from "../core/exports";

const symbolAppId = Symbol("appId");

interface RuntimeMenuItemRawData extends MenuItemRawData {
  [symbolAppId]?: string;
}

// Caching menu requests to avoid flicker.
const menuCache = new Map<string, MenuRawData>();
const menuTitleCache = new Map<string, string>();
const processMenuCache = new Map<string, SidebarMenu>();

export async function constructMenu(
  menuBar: MountRoutesResult["menuBar"],
  context: PluginRuntimeContext,
  kernel: Kernel
): Promise<void> {
  const hasSubMenu = !!menuBar.subMenuId;
  if (menuBar.menuId) {
    const defaultCollapsed = menuBar.menu?.defaultCollapsed;
    const menu = await processMenu(menuBar.menuId, context, kernel, hasSubMenu);

    if (!isNil(defaultCollapsed)) {
      menu.defaultCollapsed = defaultCollapsed;
    }

    menuBar.menu = menu;
  }
  if (hasSubMenu) {
    menuBar.subMenu = await processMenu(menuBar.subMenuId, context, kernel);
  } else {
    menuBar.subMenu = null;
  }
}

export async function preConstructMenus(
  menus: string[],
  context: PluginRuntimeContext,
  kernel: Kernel
): Promise<void> {
  const data: SidebarMenu[] = await Promise.all(
    menus.map((menuId) => processMenu(menuId, context, kernel, undefined, true))
  );
  data.forEach((item, index) => processMenuCache.set(menus[index], item));
}

export const getMenu = (menuId: string): SidebarMenu =>
  processMenuCache.get(menuId);

export async function fetchMenuById(
  menuId: string,
  kernel: Kernel,
  isPreFetch?: boolean
): Promise<MenuRawData> {
  if (menuCache.has(menuId)) {
    return menuCache.get(menuId);
  }
  const menuList = window.STANDALONE_MICRO_APPS
    ? kernel.getStandaloneMenus(menuId, isPreFetch)
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
  const validMenuList: MenuRawData[] = [];
  const injectWithMenus = new Map<string, MenuRawData[]>();
  for (const menu of menuList) {
    if (menu.items?.length > 0) {
      if (menu.type === "inject" && menu.injectMenuGroupId) {
        let injectingMenus = injectWithMenus.get(menu.injectMenuGroupId);
        if (!injectingMenus) {
          injectingMenus = [];
          injectWithMenus.set(menu.injectMenuGroupId, injectingMenus);
        }
        injectingMenus.push(menu);
      } else {
        validMenuList.push(menu);
      }
    }
  }
  return {
    ...mainMenu,
    items: validMenuList.flatMap((menu) =>
      processGroupInject(menu.items, menu, injectWithMenus)
    ),
  };
}

function processGroupInject(
  items: MenuItemRawData[],
  menu: MenuRawData,
  injectWithMenus: Map<string, MenuRawData[]>
): RuntimeMenuItemRawData[] {
  return items?.map((item) => {
    const foundInjectingMenus =
      item.groupId && injectWithMenus.get(item.groupId);
    if (foundInjectingMenus) {
      // Each menu to be injected with should be injected only once.
      injectWithMenus.delete(item.groupId);
    }
    return {
      ...item,
      children: (
        processGroupInject(item.children, menu, injectWithMenus) ?? []
      ).concat(
        foundInjectingMenus
          ? foundInjectingMenus.flatMap((injectingMenu) =>
              processGroupInject(
                injectingMenu.items,
                injectingMenu,
                injectWithMenus
              )
            )
          : []
      ),
      [symbolAppId]: menu.app[0].appId,
    };
  });
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

export async function processMenu(
  menuId: string,
  context: PluginRuntimeContext,
  kernel: Kernel,
  hasSubMenu?: boolean,
  isPreFetch?: boolean
): Promise<SidebarMenu> {
  const { items, app, ...restMenuData } = await fetchMenuById(
    menuId,
    kernel,
    isPreFetch
  );

  const appIds = collectOverrideApps(items, app[0].appId, context.app.id);
  await kernel.fulfilStoryboardI18n(appIds);

  const menuData = {
    ...computeRealValueWithOverrideApp(
      restMenuData,
      app[0].appId,
      context,
      kernel
    ),
    items: computeMenuItemsWithOverrideApp(items, context, kernel),
  };

  return {
    title: await processMenuTitle(menuData),
    icon: menuData.icon,
    link: menuData.link,
    menuItems: menuData.items
      .filter(
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
    defaultCollapsedBreakpoint: menuData.defaultCollapsedBreakpoint,
  };
}

export function collectOverrideApps(
  items: RuntimeMenuItemRawData[],
  rootAppId: string,
  contextAppId: string
): string[] {
  const appIds = new Set<string>();
  if (rootAppId !== contextAppId) {
    appIds.add(rootAppId);
  }
  function collect(items: RuntimeMenuItemRawData[]): void {
    for (const { children, ...rest } of items as RuntimeMenuItemRawData[]) {
      const overrideAppId = rest[symbolAppId];
      if (
        overrideAppId !== contextAppId &&
        !appIds.has(overrideAppId) &&
        requireOverrideApp(rest)
      ) {
        appIds.add(overrideAppId);
      }
      children && collect(children);
    }
  }
  collect(items);
  return [...appIds];
}

function computeMenuItemsWithOverrideApp(
  items: RuntimeMenuItemRawData[],
  context: PluginRuntimeContext,
  kernel: Kernel
): RuntimeMenuItemRawData[] {
  return items.map(({ children, ...rest }) => ({
    ...computeRealValueWithOverrideApp(
      rest,
      rest[symbolAppId],
      context,
      kernel
    ),
    children:
      children && computeMenuItemsWithOverrideApp(children, context, kernel),
  }));
}

export async function processMenuTitle(menuData: MenuRawData): Promise<string> {
  if (menuData.title || isEmpty(menuData.titleDataSource)) {
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

function computeRealValueWithOverrideApp<T>(
  data: T,
  overrideAppId: string,
  context: PluginRuntimeContext,
  kernel: Kernel
): T {
  let newContext = context;
  if (overrideAppId !== context.app.id && requireOverrideApp(data)) {
    const storyboard = kernel.bootstrapData.storyboards.find(
      (story) => story.app.id === overrideAppId
    );
    if (storyboard) {
      newContext = {
        ...context,
        overrideApp: storyboard.app,
      };
    }
  }
  return computeRealValue(data, newContext, true, {
    ignoreSymbols: true,
  }) as T;
}
