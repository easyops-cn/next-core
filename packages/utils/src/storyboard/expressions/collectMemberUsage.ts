import {
  MemberUsage,
  beforeVisitGlobalMember,
} from "./beforeVisitGlobalMember.js";
import { traverseStoryboardExpressions } from "./traverse.js";

export interface MemberUsageInExpressions extends MemberUsage {
  nonStaticUsage?: string;
}

export function strictCollectMemberUsage(
  data: unknown,
  objectName: string,
  level: 1 | 2 = 1
): Set<string> {
  const { hasNonStaticUsage, nonStaticUsage, usedProperties } =
    collectMemberUsage(data, objectName, level);
  if (hasNonStaticUsage) {
    throw new Error(
      `Non-static usage of ${objectName} is not supported, check your expression: "${nonStaticUsage}"`
    );
  }
  return usedProperties;
}

export function collectMemberUsage(
  data: unknown,
  objectName: string,
  level: 1 | 2 = 1
): MemberUsageInExpressions {
  const usage: MemberUsageInExpressions = {
    usedProperties: new Set(),
    hasNonStaticUsage: false,
  };
  const beforeVisitGlobal = beforeVisitGlobalMember(usage, objectName, level);
  traverseStoryboardExpressions(
    data,
    (node, parent, expr) => {
      beforeVisitGlobal(node, parent);
      if (usage.hasNonStaticUsage) {
        usage.nonStaticUsage = expr;
      }
    },
    objectName
  );
  return usage;
}
