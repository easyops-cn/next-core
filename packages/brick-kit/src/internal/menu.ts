import { isEmpty, isNil, merge, sortBy } from "lodash";
import {
  SidebarMenuItem,
  SidebarMenuSimpleItem,
  PluginRuntimeContext,
  SidebarMenu,
  MenuRawData,
  MenuItemRawData,
  MicroApp,
  UseProviderResolveConf,
} from "@next-core/brick-types";
import {
  deepFreeze,
  hasOwnProperty,
  isEvaluable,
  isObject,
  preevaluate,
  scanPermissionActionsInAny,
  scanProcessorsInAny,
} from "@next-core/brick-utils";
import {
  InstanceApi_postSearch,
  InstanceApi_getDetail,
} from "@next-sdk/cmdb-sdk";
import { InstalledMicroAppApi_getMenusInfo } from "@next-sdk/micro-app-sdk";
import { computeRealValue } from "./setProperties";
import { looseCheckIfOfComputed } from "../checkIf";
import {
  _internalApiGetCurrentContext,
  _internalApiGetResolver,
  MountRoutesResult,
  Kernel,
} from "../core/exports";
import { getI18nNamespace } from "../i18n";
import i18next from "i18next";
import { validatePermissions } from "./checkPermissions";
import { pipes } from "@next-core/pipes";

const symbolAppId = Symbol("appId");
const symbolMenuI18nNamespace = Symbol("menuI18nNamespace");
const symbolOverrideApp = Symbol("overrideApp");
const symbolShouldCache = Symbol("shouldCache");

interface RuntimeMenuItemRawData extends MenuItemRawData {
  [symbolAppId]?: string;
  [symbolMenuI18nNamespace]?: string;
  [symbolOverrideApp]?: MicroApp;
}

interface RuntimeMenuRawData extends MenuRawData {
  [symbolShouldCache]?: boolean;
  [symbolMenuI18nNamespace]?: string;
  [symbolOverrideApp]?: MicroApp;
}

// Caching menu requests to avoid flicker.
const menuCache = new Map<string, RuntimeMenuRawData>();
const menuTitleCache = new Map<string, string>();
const processMenuCache = new Map<string, SidebarMenu>();

export async function constructMenu(
  menuBar: MountRoutesResult["menuBar"],
  context: PluginRuntimeContext,
  kernel: Kernel
): Promise<void> {
  const hasSubMenu = !!menuBar.subMenuId;
  await Promise.all([
    (async () => {
      if (menuBar.menuId) {
        const defaultCollapsed = menuBar.menu?.defaultCollapsed;
        const menu = await processMenu(
          menuBar.menuId,
          context,
          kernel,
          hasSubMenu
        );

        if (!isNil(defaultCollapsed)) {
          menu.defaultCollapsed = defaultCollapsed;
        }

        menuBar.menu = menu;
      }
    })(),
    (async () => {
      if (hasSubMenu) {
        menuBar.subMenu = await processMenu(menuBar.subMenuId, context, kernel);
      } else {
        menuBar.subMenu = null;
      }
    })(),
  ]);
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
): Promise<RuntimeMenuRawData> {
  if (menuCache.has(menuId)) {
    return menuCache.get(menuId);
  }
  const menuList = window.STANDALONE_MICRO_APPS
    ? await kernel.getStandaloneMenus(menuId, isPreFetch)
    : kernel.getFeatureFlags()["three-level-menu-layout"]
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
  const menuData = await mergeMenu(menuList, kernel);
  if (!menuData) {
    throw new Error(`Menu not found: ${menuId}`);
  }
  reorderMenu(menuData);
  menuData[symbolShouldCache] && menuCache.set(menuId, menuData);
  return menuData;
}

async function mergeMenu(
  menuList: MenuRawData[],
  kernel: Kernel
): Promise<RuntimeMenuRawData> {
  const mainMenu = menuList.find((menu) => menu.type !== "inject");
  if (!mainMenu) {
    return undefined;
  }
  const validMenuList: MenuRawData[] = [];
  const injectWithMenus = new Map<string, MenuRawData[]>();
  const menuWithI18n = new WeakMap<MenuRawData, string>();
  for (const menu of menuList) {
    if (menu.i18n) {
      const menuI18nNamespace = getI18nNamespace(
        "menu",
        `${menu.menuId}~${menu.app[0].appId}+${
          (menu as { instanceId?: string }).instanceId
        }`
      );
      // Support any language in `meta.i18n`.
      Object.entries(menu.i18n).forEach(([lang, resources]) => {
        i18next.addResourceBundle(lang, menuI18nNamespace, resources);
      });
      menuWithI18n.set(menu, menuI18nNamespace);
    }
  }

  const shouldCacheList = await Promise.all(
    menuList.map((menu) => loadDynamicMenuItems(menu, kernel, menuWithI18n))
  );

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
      processGroupInject(menu.items, menu, injectWithMenus, menuWithI18n)
    ),
    [symbolShouldCache]: shouldCacheList.every(Boolean),
    [symbolMenuI18nNamespace]: menuWithI18n.get(mainMenu),
    [symbolOverrideApp]: mainMenu.overrideApp,
  };
}

function processGroupInject(
  items: MenuItemRawData[],
  menu: MenuRawData,
  injectWithMenus: Map<string, MenuRawData[]>,
  menuWithI18n: WeakMap<MenuRawData, string>
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
        processGroupInject(
          item.children,
          menu,
          injectWithMenus,
          menuWithI18n
        ) ?? []
      ).concat(
        foundInjectingMenus
          ? foundInjectingMenus.flatMap((injectingMenu) =>
              processGroupInject(
                injectingMenu.items,
                injectingMenu,
                injectWithMenus,
                menuWithI18n
              )
            )
          : []
      ),
      [symbolAppId]: menu.app[0].appId,
      [symbolMenuI18nNamespace]: menuWithI18n.get(menu),
      [symbolOverrideApp]: menu.overrideApp,
    };
  });
}

async function loadDynamicMenuItems(
  menu: MenuRawData,
  kernel: Kernel,
  menuWithI18n: WeakMap<MenuRawData, string>
): Promise<boolean> {
  if (menu.dynamicItems && menu.itemsResolve) {
    const itemsConf: Partial<{ items: MenuItemRawData[] }> = {};
    const overrideAppId = menu.app[0].appId;
    const context = _internalApiGetCurrentContext();
    let newContext = context;
    if (
      overrideAppId !== context.app.id &&
      attemptToVisit(menu.itemsResolve, ["APP", "I18N"])
    ) {
      if (window.STANDALONE_MICRO_APPS) {
        if (menu.overrideApp) {
          menu.overrideApp.config = deepFreeze(
            merge(
              {},
              menu.overrideApp.defaultConfig,
              menu.overrideApp.userConfig
            )
          );
        }
        newContext = {
          ...context,
          overrideApp: menu.overrideApp,
          appendI18nNamespace: menuWithI18n.get(menu),
        };
      } else {
        const storyboard = kernel.bootstrapData.storyboards.find(
          (story) => story.app.id === overrideAppId
        );
        newContext = {
          ...context,
          overrideApp: storyboard?.app,
          appendI18nNamespace: menuWithI18n.get(menu),
        };
      }
    }
    await _internalApiGetResolver().resolveOne(
      "reference",
      {
        transform: "items",
        transformMapArray: false,
        ...menu.itemsResolve,
      },
      itemsConf,
      null,
      newContext
    );
    menu.items = itemsConf.items;
    if ((menu.itemsResolve as UseProviderResolveConf)?.args) {
      return !attemptToVisit(
        (menu.itemsResolve as UseProviderResolveConf)?.args,
        ["QUERY", "PATH"]
      );
    }
  }
  return true;
}

function walkMenuItems(menuItems: RuntimeMenuItemRawData[]): SidebarMenuItem[] {
  return menuItems
    ?.filter(
      // `if` is already evaluated.
      looseCheckIfOfComputed
    )
    .map((item) => {
      const children = walkMenuItems(item.children);
      return item.type === "group"
        ? {
            type: "group",
            childLayout: item.childLayout,
            title: item.text,
            items: children,
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
        : (item as SidebarMenuSimpleItem);
    });
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
  const usedActions = scanPermissionActionsInAny([items, restMenuData]);
  await validatePermissions(usedActions);

  const appsRequireI18nFulfilled = new Set<string>();
  const rootAppId = app[0].appId;
  if (rootAppId !== context.app.id && !restMenuData[symbolMenuI18nNamespace]) {
    appsRequireI18nFulfilled.add(rootAppId);
  }
  collectAppsRequireI18nFulfilled(
    items,
    context.app.id,
    appsRequireI18nFulfilled
  );
  await kernel.fulfilStoryboardI18n([...appsRequireI18nFulfilled]);

  const menuData = {
    ...(await computeRealValueWithOverrideApp(
      restMenuData,
      rootAppId,
      context,
      kernel
    )),
    items: await computeMenuItemsWithOverrideApp(items, context, kernel),
  };

  return {
    title: await processMenuTitle(menuData),
    icon: menuData.icon,
    link: menuData.link,
    menuItems: walkMenuItems(menuData.items),
    defaultCollapsed: menuData.defaultCollapsed || hasSubMenu,
    defaultCollapsedBreakpoint: menuData.defaultCollapsedBreakpoint,
  };
}

export function collectAppsRequireI18nFulfilled(
  items: RuntimeMenuItemRawData[],
  contextAppId: string,
  appIds: Set<string>
): void {
  function collect(items: RuntimeMenuItemRawData[]): void {
    for (const { children, ...rest } of items as RuntimeMenuItemRawData[]) {
      const overrideAppId = rest[symbolAppId];
      if (
        !rest[symbolMenuI18nNamespace] &&
        overrideAppId !== contextAppId &&
        !appIds.has(overrideAppId) &&
        attemptToVisit(rest, ["I18N"])
      ) {
        appIds.add(overrideAppId);
      }
      children && collect(children);
    }
  }
  collect(items);
}

function computeMenuItemsWithOverrideApp(
  items: RuntimeMenuItemRawData[],
  context: PluginRuntimeContext,
  kernel: Kernel
): Promise<RuntimeMenuItemRawData[]> {
  return Promise.all(
    items.map(async ({ children, ...rest }) => {
      return {
        ...(await computeRealValueWithOverrideApp(
          rest,
          rest[symbolAppId],
          context,
          kernel
        )),
        children:
          children &&
          (await computeMenuItemsWithOverrideApp(children, context, kernel)),
      };
    })
  );
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

function reorderMenu(menuData: MenuRawData): void {
  menuData.items = reorderMenuItems(menuData.items);
}

function reorderMenuItems(list: MenuItemRawData[]): MenuItemRawData[] {
  return sortMenuItems(list).map((item) => ({
    ...item,
    children: reorderMenuItems(item.children),
  }));
}

function sortMenuItems(list: MenuItemRawData[]): MenuItemRawData[] {
  return sortBy(list, (item) => item.sort ?? -Infinity);
}

/**
 * If the menu contains evaluations which use `APP` or `I18N`,
 * we have to override app in context when computing real values.
 */
function attemptToVisit(
  data: unknown,
  globals: string[],
  memo = new WeakSet()
): boolean {
  if (typeof data === "string") {
    if (isEvaluable(data)) {
      if (globals.some((key) => data.includes(key))) {
        const { attemptToVisitGlobals } = preevaluate(data);
        return globals.some((key) => attemptToVisitGlobals.has(key));
      }
    } else if (globals.includes("APP")) {
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
      attemptToVisit(item, globals, memo)
    );
  }

  return false;
}

async function computeRealValueWithOverrideApp<
  T extends RuntimeMenuRawData | RuntimeMenuItemRawData
>(
  data: T,
  overrideAppId: string,
  context: PluginRuntimeContext,
  kernel: Kernel
): Promise<T> {
  if (
    "titleDataSource" in data &&
    isObject(data.titleDataSource) &&
    Object.entries(data.titleDataSource).every(
      ([key, value]) => value === null || value === ""
    )
  ) {
    delete data.titleDataSource;
  }
  if ("if" in data && data.if === null) {
    delete data.if;
  }
  if ("to" in data && data.to && !isEvaluable(data.to as string)) {
    const yaml = pipes.yaml(data.to as string);

    if (
      isObject(yaml) &&
      ["pathname", "search", "hash"].some((key) => hasOwnProperty(yaml, key))
    ) {
      data.to = yaml;
    }
  }

  let newContext = context;
  if (
    overrideAppId !== context.app.id &&
    attemptToVisit(data, ["APP", "I18N", "IMG"])
  ) {
    if (window.STANDALONE_MICRO_APPS) {
      if (data[symbolOverrideApp]) {
        data[symbolOverrideApp].config = deepFreeze(
          merge(
            {},
            data[symbolOverrideApp].defaultConfig,
            data[symbolOverrideApp].userConfig
          )
        );
      }
      newContext = {
        ...context,
        overrideApp: data[symbolOverrideApp],
        appendI18nNamespace: data[symbolMenuI18nNamespace],
      };
    } else {
      const storyboard = kernel.bootstrapData.storyboards.find(
        (story) => story.app.id === overrideAppId
      );
      newContext = {
        ...context,
        overrideApp: storyboard?.app,
        appendI18nNamespace: data[symbolMenuI18nNamespace],
      };
    }
  }
  const processors = scanProcessorsInAny(data);
  await kernel.loadDynamicBricks([], processors);
  await kernel.router.waitForUsedContext(data);
  return computeRealValue(data, newContext, true, {
    ignoreSymbols: true,
  }) as T;
}
