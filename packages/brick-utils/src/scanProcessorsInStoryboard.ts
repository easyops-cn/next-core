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

function collectProcessors(data: unknown, collection: string[]): void {
  if (typeof data === "string") {
    if (data.includes(PROCESSORS) && isEvaluable(data)) {
      preevaluate(data, {
        visitors: {
          MemberExpression: (node: MemberExpression, state, callback) => {
            if (
              !node.computed &&
              node.object.type === "Identifier" &&
              node.object.name === PROCESSORS &&
              node.property.type === "Identifier"
            ) {
              collection.push(node.property.name);
            }
            PrecookVisitor.MemberExpression(node, state, callback);
          },
        },
      });
    }
  } else if (Array.isArray(data)) {
    for (const item of data) {
      collectProcessors(item, collection);
    }
  } else if (isObject(data)) {
    for (const item of Object.values(data)) {
      collectProcessors(item, collection);
    }
  }
}
