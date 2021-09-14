import { CallExpression } from "@babel/types";
import { Storyboard } from "@next-core/brick-types";
import { isObject } from "./isObject";
import { isEvaluable, preevaluate } from "./cook";

interface ESTreeStringLiteral {
  type: "Literal";
  value: string;
}

interface MetaOfStoryboardToBuild {
  // The storyboard built by `nextBuilder.buildStoryboard` contains
  // data of menus, which will be passed to the build-&-push API.
  menus?: Record<string, unknown>[];
}

const I18N = "I18N";

export function scanI18NInStoryboard(
  storyboard: Storyboard
): Map<string, Set<string>> {
  // Notice: `menus` may contain evaluations of I18N too.
  return scanI18NInAny([
    storyboard.routes,
    storyboard.meta && [
      storyboard.meta.customTemplates,
      (storyboard.meta as unknown as MetaOfStoryboardToBuild).menus,
    ],
  ]);
}

export function scanI18NInAny(data: unknown): Map<string, Set<string>> {
  const collection = new Map<string, Set<string>>();
  collectI18N(data, collection);
  return collection;
}

function collectI18N(
  data: unknown,
  collection: Map<string, Set<string>>,
  memo = new WeakSet()
): void {
  if (typeof data === "string") {
    if (data.includes(I18N) && isEvaluable(data)) {
      preevaluate(data, {
        visitors: {
          CallExpression(node: CallExpression) {
            const [keyNode, defaultNode] =
              node.arguments as unknown as ESTreeStringLiteral[];
            if (
              node.callee.type === "Identifier" &&
              node.callee.name === I18N &&
              keyNode &&
              keyNode.type === "Literal" &&
              typeof keyNode.value === "string"
            ) {
              let valueSet = collection.get(keyNode.value);
              if (!valueSet) {
                valueSet = new Set();
                collection.set(keyNode.value, valueSet);
              }
              if (
                defaultNode &&
                defaultNode.type === "Literal" &&
                typeof defaultNode.value === "string"
              ) {
                valueSet.add(defaultNode.value);
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
        collectI18N(item, collection, memo);
      }
    } else {
      for (const item of Object.values(data)) {
        collectI18N(item, collection, memo);
      }
    }
  }
}
