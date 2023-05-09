import type { Identifier } from "@babel/types";
import type { EstreeParent } from "@next-core/cook";

export interface MemberUsage {
  usedProperties: Set<string>;
  hasNonStaticUsage: boolean;
}

export type BeforeVisitGlobal = (
  node: Identifier,
  parent: EstreeParent
) => void;

export function beforeVisitGlobalMember(
  usage: MemberUsage,
  objectName: string | string[],
  level: 1 | 2 = 1,
  rememberObjectName = false
): BeforeVisitGlobal {
  return function beforeVisitGlobal(node, parent): void {
    if (
      typeof objectName === "string"
        ? node.name === objectName
        : objectName.includes(node.name)
    ) {
      const segments: string[] = [];
      for (let i = 1; i <= level; i++) {
        const memberParent = parent[parent.length - i];
        if (
          memberParent?.node.type === "MemberExpression" &&
          memberParent.key === "object"
        ) {
          const memberNode = memberParent.node;
          if (
            !memberNode.computed &&
            memberNode.property.type === "Identifier"
          ) {
            segments.push(
              rememberObjectName
                ? `${node.name}.${memberNode.property.name}`
                : memberNode.property.name
            );
          } else if (
            memberNode.computed &&
            (memberNode.property as any).type === "Literal" &&
            typeof (memberNode.property as any).value === "string"
          ) {
            segments.push(
              rememberObjectName
                ? `${node.name}.${(memberNode.property as any).value}`
                : (memberNode.property as any).value
            );
          } else {
            usage.hasNonStaticUsage = true;
          }
        } else {
          usage.hasNonStaticUsage = true;
        }
      }
      if (segments.length === level) {
        usage.usedProperties.add(segments.join("."));
      }
    }
  };
}
