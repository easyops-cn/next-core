import { uniq } from "lodash";
import { Storyboard } from "@next-core/brick-types";
import { PrecookHooks } from "./cook";
import { visitStoryboardExpressions } from "./visitStoryboard";

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
  visitStoryboardExpressions(
    data,
    beforeVisitProcessorsFactory(collection),
    PROCESSORS
  );
  return isUniq ? uniq(collection) : collection;
}

function beforeVisitProcessorsFactory(
  collection: string[]
): PrecookHooks["beforeVisitGlobal"] {
  return function beforeVisitProcessors(node, parent): void {
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
  };
}
