import { _internalApiGetStoryboardInBootstrapData } from "../Runtime.js";
import { MenuRawData } from "./interfaces.js";

export function getMenusOfStandaloneApp(
  menuId: string,
  appId: string
): MenuRawData[] {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const storyboard = _internalApiGetStoryboardInBootstrapData(appId)!;
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
