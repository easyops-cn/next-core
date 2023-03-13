import { isEmpty } from "lodash";
import { InstanceApi_getDetail } from "@next-api-sdk/cmdb-sdk";
import type { MenuRawData } from "./interfaces.js";

const menuTitleCache = new Map<string, string>();

export async function fetchMenuTitle(
  menuData: Pick<MenuRawData, "title" | "titleDataSource">
) {
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
