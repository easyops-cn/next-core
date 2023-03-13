import type { MenuItemRawData, MenuRawData } from "./interfaces.js";
import type { RuntimeContext } from "../interfaces.js";
import { _internalApiGetAppInBootstrapData } from "../Runtime.js";
import { resolveData } from "../data/resolveData.js";

export async function loadDynamicMenuItems(
  menu: MenuRawData,
  runtimeContext: RuntimeContext,
  menuWithI18n: WeakMap<MenuRawData, string>
): Promise<void> {
  if (menu.dynamicItems && menu.itemsResolve) {
    const overrideAppId = menu.app[0].appId;
    let newRuntimeContext = runtimeContext;
    if (overrideAppId !== runtimeContext.app.id) {
      newRuntimeContext = {
        ...runtimeContext,
        overrideApp: _internalApiGetAppInBootstrapData(overrideAppId),
        appendI18nNamespace: menuWithI18n.get(menu),
      };
    }
    const resolved = (await resolveData(
      {
        transform: "items",
        ...menu.itemsResolve,
      },
      newRuntimeContext
    )) as { items: MenuItemRawData[] };
    menu.items = resolved.items;
  }
}
