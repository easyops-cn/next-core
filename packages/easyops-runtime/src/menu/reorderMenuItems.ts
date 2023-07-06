import { sortBy } from "lodash";
import { MenuItemRawData, MenuRawData } from "./interfaces.js";

export function reorderMenu(menuData: MenuRawData): void {
  menuData.items = reorderMenuItems(menuData.items);
}

function reorderMenuItems(
  list: MenuItemRawData[] | undefined
): MenuItemRawData[] {
  return sortMenuItems(list).map((item) => ({
    ...item,
    children: reorderMenuItems(item.children),
  }));
}

function sortMenuItems(list: MenuItemRawData[] | undefined): MenuItemRawData[] {
  return sortBy(list, (item) => item.sort ?? -Infinity);
}
