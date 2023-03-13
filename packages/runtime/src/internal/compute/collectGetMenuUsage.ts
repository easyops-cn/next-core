import type { Identifier } from "@babel/types";
import type { EstreeLiteral, EstreeParent } from "@next-core/cook";

const APP = "APP";
const getMenu = "getMenu";

export interface GetMenuUsage {
  usedMenuIds: Set<string>;
  hasNonStaticUsage: boolean;
}

export function collectGetMenuUsage(
  usage: GetMenuUsage,
  node: Identifier,
  parent: EstreeParent
) {
  if (node.name === APP) {
    const memberParent = parent[parent.length - 1];
    const callParent = parent[parent.length - 2];
    if (
      callParent?.node.type === "CallExpression" &&
      callParent?.key === "callee" &&
      memberParent?.node.type === "MemberExpression" &&
      memberParent.key === "object" &&
      (memberParent.node.computed
        ? (memberParent.node.property as any).type === "Literal" &&
          (memberParent.node.property as any).value === getMenu
        : memberParent.node.property.type === "Identifier" &&
          memberParent.node.property.name === getMenu)
    ) {
      const args = callParent.node.arguments as unknown as EstreeLiteral[];
      if (args.length > 0) {
        const menuId = args[0];
        if (menuId.type === "Literal" && typeof menuId.value === "string") {
          usage.usedMenuIds.add(menuId.value);
        } else {
          usage.hasNonStaticUsage = true;
        }
      }
    }
  }
}
