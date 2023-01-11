import { uniq } from "lodash";
import { Storyboard } from "@next-core/brick-types";
import { PrecookHooks } from "./cook";
import { visitStoryboardExpressions } from "./visitStoryboard";

const USE_WIDGET_FUNCTION = "__WIDGET_FN__";

export function scanUseWidgetInStoryboard(
  storyboard: Storyboard,
  isUniq = true
): string[] {
  return scanUseWidgetInAny(
    [storyboard.routes, storyboard.meta?.customTemplates],
    isUniq
  );
}

export function scanUseWidgetInAny(data: unknown, isUniq = true): string[] {
  const collection: string[] = [];
  visitStoryboardExpressions(
    data,
    beforeVisitProcessorsFactory(collection),
    USE_WIDGET_FUNCTION
  );
  return isUniq ? uniq(collection) : collection;
}

function beforeVisitProcessorsFactory(
  collection: string[]
): PrecookHooks["beforeVisitGlobal"] {
  return function beforeVisitProcessors(node, parent): void {
    if (node.name === USE_WIDGET_FUNCTION) {
      const memberParent = parent[parent.length - 1];
      if (
        memberParent?.node.type === "MemberExpression" &&
        memberParent.key === "object" &&
        memberParent.node.computed
      ) {
        collection.push(`${(memberParent.node.property as any).value}`);
      }
    }
  };
}
