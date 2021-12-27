import { Storyboard } from "@next-core/brick-types";
import { PrecookHooks } from "./cook";
import {
  visitStoryboardExpressions,
  visitStoryboardFunctions,
} from "./visitStoryboard";

interface ESTreeStringLiteral {
  type: "Literal";
  value: string;
}

const I18N = "I18N";

export function scanI18NInStoryboard(
  storyboard: Storyboard
): Map<string, Set<string>> {
  const collection = new Map<string, Set<string>>();
  const beforeVisitI18n = beforeVisitI18nFactory(collection);
  // Notice: `menus` may contain evaluations of I18N too.
  const { customTemplates, menus, functions } = storyboard.meta ?? {};
  visitStoryboardExpressions(
    [storyboard.routes, customTemplates, menus],
    beforeVisitI18n,
    I18N
  );
  visitStoryboardFunctions(functions, beforeVisitI18n);
  return collection;
}

export function scanI18NInAny(data: unknown): Map<string, Set<string>> {
  const collection = new Map<string, Set<string>>();
  visitStoryboardExpressions(data, beforeVisitI18nFactory(collection), I18N);
  return collection;
}

function beforeVisitI18nFactory(
  collection: Map<string, Set<string>>
): PrecookHooks["beforeVisitGlobal"] {
  return function beforeVisitI18n(node, parent): void {
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
