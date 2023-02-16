import type { StoryboardFunction } from "@next-core/types";
import {
  MemberUsage,
  beforeVisitGlobalMember,
} from "../expressions/beforeVisitGlobalMember.js";
import { traverseStoryboardFunction } from "./traverse.js";

export function strictCollectMemberUsageInFunction(
  fn: StoryboardFunction,
  objectName: string,
  level: 1 | 2 = 1
): Set<string> {
  const { hasNonStaticUsage, usedProperties } = collectMemberUsageInFunction(
    fn,
    objectName,
    level
  );
  if (hasNonStaticUsage) {
    throw new Error(
      `Non-static usage of ${objectName} is not supported, check your function: "${fn.name}"`
    );
  }
  return usedProperties;
}

export function collectMemberUsageInFunction(
  fn: StoryboardFunction,
  objectName: string,
  level: 1 | 2 = 1
): MemberUsage {
  const usage: MemberUsage = {
    usedProperties: new Set(),
    hasNonStaticUsage: false,
  };

  traverseStoryboardFunction(
    fn,
    beforeVisitGlobalMember(usage, objectName, level)
  );

  usage.usedProperties.delete(fn.name);

  return usage;
}
