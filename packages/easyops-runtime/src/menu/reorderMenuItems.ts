import { sortBy } from "lodash";
import { MenuItemRawData, MenuRawData } from "./interfaces.js";

export function reorderMenuItems(menuData: MenuRawData): void {
  menuData.items = sortMenuItems(menuData.items).map((item) => ({
    ...item,
    children: sortMenuItems(item.children) as MenuItemRawData[],
  }));
}

function sortMenuItems(list: MenuItemRawData[] | undefined): MenuItemRawData[] {
  return sortBy(list, (item) => item.sort ?? -Infinity);
}
