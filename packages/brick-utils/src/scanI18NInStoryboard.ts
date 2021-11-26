import { Storyboard } from "@next-core/brick-types";
import { isObject } from "./isObject";
import { isEvaluable, preevaluate, precookFunction, EstreeNode } from "./cook";

interface ESTreeStringLiteral {
  type: "Literal";
  value: string;
}

const I18N = "I18N";

export function scanI18NInStoryboard(
  storyboard: Storyboard
): Map<string, Set<string>> {
  const collection = new Map<string, Set<string>>();
  const beforeVisit = beforeVisitFactory(collection);
  // Notice: `menus` may contain evaluations of I18N too.
  const { customTemplates, menus, functions } = storyboard.meta ?? {};
  collectI18N([storyboard.routes, customTemplates, menus], beforeVisit);
  if (Array.isArray(functions)) {
    for (const fn of functions) {
      precookFunction(fn.source, {
        typescript: fn.typescript,
        hooks: { beforeVisit },
      });
    }
  }
  return collection;
}

export function scanI18NInAny(data: unknown): Map<string, Set<string>> {
  const collection = new Map<string, Set<string>>();
  collectI18N(data, beforeVisitFactory(collection));
  return collection;
}

function collectI18N(
  data: unknown,
  beforeVisit: (node: EstreeNode) => void,
  memo = new WeakSet()
): void {
  if (typeof data === "string") {
    if (data.includes(I18N) && isEvaluable(data)) {
      preevaluate(data, {
        hooks: { beforeVisit },
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
        collectI18N(item, beforeVisit, memo);
      }
    } else {
      for (const item of Object.values(data)) {
        collectI18N(item, beforeVisit, memo);
      }
    }
  }
}

function beforeVisitFactory(collection: Map<string, Set<string>>) {
  return function beforeVisit(node: EstreeNode): void {
    if (node.type === "CallExpression") {
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
    }
  };
}
