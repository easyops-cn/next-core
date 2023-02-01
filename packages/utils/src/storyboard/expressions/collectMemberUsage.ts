import {
  BeforeVisitGlobalWithExpr,
  traverseStoryboardExpressions,
} from "./traverse.js";

export interface MemberUsage {
  usedProperties: Set<string>;
  hasNonStaticUsage: string | false;
}

export function strictCollectMemberUsage(
  data: unknown,
  objectName: string,
  level: 1 | 2 = 1
): Set<string> {
  const { hasNonStaticUsage, usedProperties } = collectMemberUsage(
    data,
    objectName,
    level
  );
  if (hasNonStaticUsage) {
    throw new Error(
      `Non-static usage of ${objectName} is not supported, check your expression: "${hasNonStaticUsage}"`
    );
  }
  return usedProperties;
}

export function collectMemberUsage(
  data: unknown,
  objectName: string,
  level: 1 | 2 = 1
): MemberUsage {
  const usage: MemberUsage = {
    usedProperties: new Set(),
    hasNonStaticUsage: false,
  };
  traverseStoryboardExpressions(
    data,
    beforeVisitGlobalFactory(usage, objectName, level),
    objectName
  );
  return usage;
}

function beforeVisitGlobalFactory(
  usage: MemberUsage,
  objectName: string,
  level: 1 | 2 = 1
): BeforeVisitGlobalWithExpr {
  return function beforeVisitGlobal(node, parent, expr): void {
    if (node.name === objectName) {
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
            segments.push(memberNode.property.name);
          } else if (
            memberNode.computed &&
            (memberNode.property as any).type === "Literal" &&
            typeof (memberNode.property as any).value === "string"
          ) {
            segments.push((memberNode.property as any).value);
          } else {
            usage.hasNonStaticUsage = expr;
          }
        } else {
          usage.hasNonStaticUsage = expr;
        }
      }
      if (segments.length === level) {
        usage.usedProperties.add(segments.join("."));
      }
    }
  };
}
