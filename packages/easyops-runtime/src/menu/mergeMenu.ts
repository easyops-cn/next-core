import { i18n } from "@next-core/i18n";
import {
  symbolAppId,
  symbolMenuI18nNamespace,
  symbolOverrideApp,
} from "./constants.js";
import type {
  RuntimeContext,
  MenuItemRawData,
  MenuRawData,
  RuntimeMenuItemRawData,
  RuntimeMenuRawData,
  RuntimeHelpers,
} from "./interfaces.js";
import { loadDynamicMenuItems } from "./loadDynamicMenuItems.js";

export async function mergeMenu(
  menuList: MenuRawData[],
  runtimeContext: RuntimeContext,
  helpers: RuntimeHelpers
): Promise<RuntimeMenuRawData | undefined> {
  const mainMenu = menuList.find((menu) => menu.type !== "inject");
  if (!mainMenu) {
    return undefined;
  }
  const validMenuList: MenuRawData[] = [];
  const injectWithMenus = new Map<string, MenuRawData[]>();
  const menuWithI18n = new WeakMap<MenuRawData, string>();

  for (const menu of menuList) {
    if (menu.i18n) {
      const menuI18nNamespace = `menu/${menu.menuId}~${menu.app[0].appId}+${
        (menu as { instanceId?: string }).instanceId
      }`;
      // Support any language in `menu.i18n`.
      Object.entries(menu.i18n).forEach(([lang, resources]) => {
        i18n.addResourceBundle(lang, menuI18nNamespace, resources);
      });
      menuWithI18n.set(menu, menuI18nNamespace);
    }
  }

  await Promise.all(
    menuList.map((menu) =>
      loadDynamicMenuItems(menu, runtimeContext, menuWithI18n, helpers)
    )
  );

  for (const menu of menuList) {
    if (menu.items?.length) {
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
    items: validMenuList.flatMap(
      (menu) =>
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        processGroupInject(menu.items, menu, injectWithMenus, menuWithI18n)!
    ),
    [symbolMenuI18nNamespace]: menuWithI18n.get(mainMenu),
    [symbolOverrideApp]: mainMenu.overrideApp,
  };
}

function processGroupInject(
  items: MenuItemRawData[] | undefined,
  menu: MenuRawData,
  injectWithMenus: Map<string, MenuRawData[]>,
  menuWithI18n: WeakMap<MenuRawData, string>
): RuntimeMenuItemRawData[] | undefined {
  return items?.map((item) => {
    const foundInjectingMenus =
      item.groupId && injectWithMenus.get(item.groupId);
    if (foundInjectingMenus) {
      // Each menu to be injected with should be injected only once.
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      injectWithMenus.delete(item.groupId!);
    }
    return {
      ...item,
      children: (
        processGroupInject(
          item.children,
          menu,
          injectWithMenus,
          menuWithI18n
        ) ?? ([] as RuntimeMenuItemRawData[])
      ).concat(
        foundInjectingMenus
          ? foundInjectingMenus.flatMap(
              (injectingMenu) =>
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                processGroupInject(
                  injectingMenu.items,
                  injectingMenu,
                  injectWithMenus,
                  menuWithI18n
                )!
            )
          : ([] as RuntimeMenuItemRawData[])
      ),
      [symbolAppId]: menu.app[0].appId,
      [symbolMenuI18nNamespace]: menuWithI18n.get(menu),
      [symbolOverrideApp]: menu.overrideApp,
    };
  });
}
