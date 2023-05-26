import { MenuRawData, RuntimeHelpers } from "./interfaces.js";

export function getMenusOfStandaloneApp(
  menuId: string,
  appId: string,
  helpers: RuntimeHelpers
): MenuRawData[] {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const storyboard = helpers.getStoryboardByAppId(appId)!;
  const menus = (storyboard.meta?.injectMenus ??
    storyboard.meta?.menus ??
    []) as MenuRawData[];

  return menus
    .filter((menu) => menu.menuId === menuId)
    .map((menu) => ({
      ...menu,
      ...(menu.app?.[0]?.appId ? {} : { app: [{ appId }] }),
    }));

  // Todo: maybe: fetch menus from STANDALONE_MENU@EASYOPS
}
