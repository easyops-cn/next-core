import { CallExpression } from "@babel/types";
import { Storyboard } from "@next-core/brick-types";
import { isObject } from "./isObject";
import { isEvaluable, preevaluate } from "./cook/preevaluate";
import PrecookVisitor from "./cook/PrecookVisitor";

interface ESTreeStringLiteral {
  type: "Literal";
  value: string;
}

const I18N = "I18N";

export function scanI18NInStoryboard(
  storyboard: Storyboard
): Map<string, Set<string>> {
  return scanI18NInAny([storyboard.routes, storyboard.meta?.customTemplates]);
}

export function scanI18NInAny(data: unknown): Map<string, Set<string>> {
  const collection = new Map<string, Set<string>>();
  collectProcessors(data, collection);
  return collection;
}

function collectProcessors(
  data: unknown,
  collection: Map<string, Set<string>>,
  memo = new WeakSet()
): void {
  if (typeof data === "string") {
    if (data.includes(I18N) && isEvaluable(data)) {
      preevaluate(data, {
        visitors: {
          CallExpression: (node: CallExpression, state, callback) => {
            let keyNode: ESTreeStringLiteral;
            let defaultNode: ESTreeStringLiteral;
            if (
              node.callee.type === "Identifier" &&
              node.callee.name === I18N &&
              node.arguments.length > 0 &&
              ((keyNode = (node
                .arguments[0] as unknown) as ESTreeStringLiteral),
              keyNode.type === "Literal" && typeof keyNode.value === "string")
            ) {
              let valueSet = collection.get(keyNode.value);
              if (!valueSet) {
                valueSet = new Set();
                collection.set(keyNode.value, valueSet);
              }
              if (
                node.arguments.length > 1 &&
                ((defaultNode = (node
                  .arguments[1] as unknown) as ESTreeStringLiteral),
                defaultNode.type === "Literal" &&
                  typeof defaultNode.value === "string")
              ) {
                valueSet.add(defaultNode.value);
              }
            }
            PrecookVisitor.CallExpression(node, state, callback);
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
