import { isObject } from "../isObject";

const fieldsToKeepInMenu = [
  "menuId",
  "title",
  "icon",
  "titleDataSource",
  "defaultCollapsed",
  "defaultCollapsedBreakpoint",
  "link",
  "type",
  "injectMenuGroupId",
  "dynamicItems",
  "itemsResolve",
];

const fieldsToKeepInMenuItem = [
  "text",
  "to",
  "href",
  "target",
  "icon",
  "exact",
  "key",
  "activeIncludes",
  "activeExcludes",
  "activeMatchSearch",
  "type",
  "sort",
  "defaultExpanded",
  "if",
  "groupId",
  "childLayout",
];

export interface MenuNode {
  items?: MenuItemNode[];
  [key: string]: unknown;
}

export interface MenuItemNode {
  children?: MenuItemNode[];
  [key: string]: unknown;
}

export function normalizeMenu(node: MenuNode): Record<string, unknown> {
  return {
    ...keep(node, fieldsToKeepInMenu),
    items: keepItems(node.items, fieldsToKeepInMenuItem),
  };
}

function keep(
  node: MenuNode | MenuItemNode,
  fieldsToKeep: string[]
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(node)
      // Keep certain fields from CMDB.
      .filter(([key, value]) => {
        if (
          key === "titleDataSource" &&
          isObject(value) &&
          Object.entries(value).every(
            (item) => item[1] === null || item[1] === ""
          )
        ) {
          return false;
        }
        if (key === "if" && value === null) {
          return false;
        }
        return fieldsToKeep.includes(key);
      })
  );
}

function keepItems(
  nodes: MenuItemNode[],
  fieldsToKeep: string[]
): Record<string, unknown>[] {
  return nodes?.map((node) => ({
    ...keep(node, fieldsToKeep),
    children: keepItems(node.children, fieldsToKeep),
  }));
}
