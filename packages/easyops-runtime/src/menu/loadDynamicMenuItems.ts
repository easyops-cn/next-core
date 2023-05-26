import type {
  RuntimeContext,
  MenuItemRawData,
  MenuRawData,
  RuntimeHelpers,
} from "./interfaces.js";

export async function loadDynamicMenuItems(
  menu: MenuRawData,
  runtimeContext: RuntimeContext,
  menuWithI18n: WeakMap<MenuRawData, string>,
  helpers: RuntimeHelpers
): Promise<void> {
  if (menu.dynamicItems && menu.itemsResolve) {
    const overrideAppId = menu.app[0].appId;
    let newRuntimeContext = runtimeContext;
    if (overrideAppId !== runtimeContext.app.id) {
      const overrideApp = window.STANDALONE_MICRO_APPS
        ? menu.overrideApp
        : helpers.getStoryboardByAppId(overrideAppId)?.app;
      newRuntimeContext = {
        ...runtimeContext,
        overrideApp,
        appendI18nNamespace: menuWithI18n.get(menu),
      };
    }
    const resolved = (await helpers.resolveData(
      {
        transform: "items",
        ...menu.itemsResolve,
      },
      newRuntimeContext
    )) as { items: MenuItemRawData[] };
    menu.items = resolved.items;
  }
}
