import { uniq } from "lodash";
import { MemberExpression } from "@babel/types";
import { Storyboard } from "@easyops/brick-types";
import { isObject } from "./isObject";
import { isEvaluable, preevaluate } from "./cook/preevaluate";
import PrecookVisitor from "./cook/PrecookVisitor";

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
        visitors: {
          MemberExpression: (node: MemberExpression, state, callback) => {
            const accessNamespace = node.object;
            if (
              !node.computed &&
              node.property.type === "Identifier" &&
              accessNamespace.type === "MemberExpression" &&
              !accessNamespace.computed &&
              accessNamespace.object.type === "Identifier" &&
              accessNamespace.object.name === PROCESSORS &&
              accessNamespace.property.type === "Identifier"
            ) {
              collection.push(
                `${accessNamespace.property.name}.${node.property.name}`
              );
            }
            PrecookVisitor.MemberExpression(node, state, callback);
          },
        },
      });
    }
  } else if (isObject(data)) {
    // Avoid call stack overflow.
    if (memo.has(data as any)) {
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
