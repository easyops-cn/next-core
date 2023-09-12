import type { StoryboardFunction } from "@next-core/types";
import {
  MemberUsage,
  beforeVisitGlobalMember,
} from "../expressions/beforeVisitGlobalMember.js";
import { traverseStoryboardFunction } from "./traverse.js";

export function collectMemberUsageInFunction(
  fn: StoryboardFunction,
  objectName: string,
  silentErrors?: boolean,
  level: 1 | 2 = 1
): Set<string> {
  const usage: MemberUsage = {
    usedProperties: new Set(),
    hasNonStaticUsage: false,
  };

  traverseStoryboardFunction(
    fn,
    beforeVisitGlobalMember(usage, objectName, level),
    silentErrors
  );

  if (usage.hasNonStaticUsage && !silentErrors) {
    throw new Error(
      `Non-static usage of ${objectName} is prohibited, check your function: "${fn.name}"`
    );
  }

  usage.usedProperties.delete(fn.name);

  return usage.usedProperties;
}
