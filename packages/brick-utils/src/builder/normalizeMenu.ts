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
      .filter((item) => fieldsToKeep.includes(item[0]))
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
