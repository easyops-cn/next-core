import type { Identifier } from "@babel/types";
import type { EstreeLiteral, EstreeParent } from "@next-core/cook";

export interface MemberCallUsage {
  usedArgs: Set<string>;
  hasNonStaticUsage?: boolean;
}

function collectMemberCallUsageFactory(object: string, property: string) {
  return function collectMemberCallUsage(
    usage: MemberCallUsage,
    node: Identifier,
    parent: EstreeParent
  ) {
    if (node.name === object) {
      const memberParent = parent[parent.length - 1];
      const callParent = parent[parent.length - 2];
      if (
        callParent?.node.type === "CallExpression" &&
        callParent?.key === "callee" &&
        memberParent?.node.type === "MemberExpression" &&
        memberParent.key === "object" &&
        (memberParent.node.computed
          ? (memberParent.node.property as any).type === "Literal" &&
            (memberParent.node.property as any).value === property
          : memberParent.node.property.type === "Identifier" &&
            memberParent.node.property.name === property)
      ) {
        const args = callParent.node.arguments as unknown as EstreeLiteral[];
        if (args.length > 0) {
          const firstArg = args[0];
          if (
            firstArg.type === "Literal" &&
            typeof firstArg.value === "string"
          ) {
            usage.usedArgs.add(firstArg.value);
          } else {
            usage.hasNonStaticUsage = true;
          }
        }
      }
    }
  };
}

export const collectAppGetMenuUsage = collectMemberCallUsageFactory(
  "APP",
  "getMenu"
);

export const collectInstalledAppsHasUsage = collectMemberCallUsageFactory(
  "INSTALLED_APPS",
  "has"
);
