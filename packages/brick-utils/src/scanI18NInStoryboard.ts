import { Storyboard } from "@next-core/brick-types";
import { isObject } from "./isObject";
import {
  isEvaluable,
  preevaluate,
  precookFunction,
  PrecookHooks,
} from "./cook";

interface ESTreeStringLiteral {
  type: "Literal";
  value: string;
}

const I18N = "I18N";

export function scanI18NInStoryboard(
  storyboard: Storyboard
): Map<string, Set<string>> {
  const collection = new Map<string, Set<string>>();
  const beforeVisitGlobal = beforeVisitGlobalFactory(collection);
  // Notice: `menus` may contain evaluations of I18N too.
  const { customTemplates, menus, functions } = storyboard.meta ?? {};
  collectI18N([storyboard.routes, customTemplates, menus], beforeVisitGlobal);
  if (Array.isArray(functions)) {
    for (const fn of functions) {
      precookFunction(fn.source, {
        typescript: fn.typescript,
        withParent: true,
        hooks: { beforeVisitGlobal },
      });
    }
  }
  return collection;
}

export function scanI18NInAny(data: unknown): Map<string, Set<string>> {
  const collection = new Map<string, Set<string>>();
  collectI18N(data, beforeVisitGlobalFactory(collection));
  return collection;
}

function collectI18N(
  data: unknown,
  beforeVisitGlobal: PrecookHooks["beforeVisitGlobal"],
  memo = new WeakSet()
): void {
  if (typeof data === "string") {
    if (data.includes(I18N) && isEvaluable(data)) {
      preevaluate(data, {
        withParent: true,
        hooks: { beforeVisitGlobal },
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
        collectI18N(item, beforeVisitGlobal, memo);
      }
    } else {
      for (const item of Object.values(data)) {
        collectI18N(item, beforeVisitGlobal, memo);
      }
    }
  }
}

function beforeVisitGlobalFactory(
  collection: Map<string, Set<string>>
): PrecookHooks["beforeVisitGlobal"] {
  return function beforeVisitGlobal(node, parent): void {
    if (node.name === I18N) {
      const callParent = parent[parent.length - 1];
      if (
        callParent?.node.type === "CallExpression" &&
        callParent.key === "callee"
      ) {
        const [keyNode, defaultNode] = callParent.node
          .arguments as unknown as ESTreeStringLiteral[];
        if (
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
    }
  };
}
