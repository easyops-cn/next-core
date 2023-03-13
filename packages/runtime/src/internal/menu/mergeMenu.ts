import { i18n } from "@next-core/i18n";
import { getI18nNamespace } from "../registerAppI18n.js";
import { symbolAppId, symbolMenuI18nNamespace } from "./constants.js";
import type {
  MenuItemRawData,
  MenuRawData,
  RuntimeMenuItemRawData,
  RuntimeMenuRawData,
} from "./interfaces.js";
import type { RuntimeContext } from "../interfaces.js";
import { loadDynamicMenuItems } from "./loadDynamicMenuItems.js";

export async function mergeMenu(
  menuList: MenuRawData[],
  runtimeContext: RuntimeContext
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
      const menuI18nNamespace = getI18nNamespace(
        "menu",
        `${menu.menuId}~${menu.app[0].appId}+${
          (menu as { instanceId?: string }).instanceId
        }`
      );
      // Support any language in `menu.i18n`.
      Object.entries(menu.i18n).forEach(([lang, resources]) => {
        i18n.addResourceBundle(lang, menuI18nNamespace, resources);
      });
      menuWithI18n.set(menu, menuI18nNamespace);
    }
  }

  await Promise.all(
    menuList.map((menu) =>
      loadDynamicMenuItems(menu, runtimeContext, menuWithI18n)
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
        processGroupInject(menu.items, menu, injectWithMenus, menuWithI18n)!
    ),
    [symbolMenuI18nNamespace]: menuWithI18n.get(mainMenu),
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
    };
  });
}
