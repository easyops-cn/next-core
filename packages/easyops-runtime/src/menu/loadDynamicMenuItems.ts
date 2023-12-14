import { preCheckPermissionsForAny } from "../checkPermissions.js";
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
    const newRuntimeContext = {
      ...runtimeContext,
      pendingPermissionsPreCheck: [
        ...runtimeContext.pendingPermissionsPreCheck,
        preCheckPermissionsForAny(menu.itemsResolve),
      ],
    };
    if (overrideAppId !== runtimeContext.app.id) {
      newRuntimeContext.overrideApp = window.STANDALONE_MICRO_APPS
        ? menu.overrideApp
        : helpers.getStoryboardByAppId(overrideAppId)?.app;
      newRuntimeContext.appendI18nNamespace = menuWithI18n.get(menu);
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
