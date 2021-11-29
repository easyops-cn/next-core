import { uniq } from "lodash";
import { Storyboard } from "@next-core/brick-types";
import { isObject } from "./isObject";
import { isEvaluable, preevaluate } from "./cook";

const PROCESSORS = "PROCESSORS";

export function scanProcessorsInStoryboard(
  storyboard: Storyboard,
  isUniq = true
): string[] {
  return scanProcessorsInAny(
    [storyboard.routes, storyboard.meta?.customTemplates],
    isUniq
  );
}

export function scanProcessorsInAny(data: unknown, isUniq = true): string[] {
  const collection: string[] = [];
  collectProcessors(data, collection);
  return isUniq ? uniq(collection) : collection;
}

function collectProcessors(
  data: unknown,
  collection: string[],
  memo = new WeakSet()
): void {
  if (typeof data === "string") {
    if (data.includes(PROCESSORS) && isEvaluable(data)) {
      preevaluate(data, {
        withParent: true,
        hooks: {
          beforeVisitGlobal(node, parent): void {
            if (node.name === PROCESSORS) {
              const memberParent = parent[parent.length - 1];
              const outerMemberParent = parent[parent.length - 2];
              if (
                memberParent?.node.type === "MemberExpression" &&
                memberParent.key === "object" &&
                !memberParent.node.computed &&
                memberParent.node.property.type === "Identifier" &&
                outerMemberParent?.node.type === "MemberExpression" &&
                outerMemberParent.key === "object" &&
                !outerMemberParent.node.computed &&
                outerMemberParent.node.property.type === "Identifier"
              ) {
                collection.push(
                  `${memberParent.node.property.name}.${outerMemberParent.node.property.name}`
                );
              }
            }
          },
        },
      });
    }
  } else if (isObject(data)) {
    // Avoid call stack overflow.
    if (memo.has(data)) {
      return;
    }
    memo.add(data);
    if (Array.isArray(data)) {
      for (const item of data) {
        collectProcessors(item, collection, memo);
      }
    } else {
      for (const item of Object.values(data)) {
        collectProcessors(item, collection, memo);
      }
    }
  }
}
