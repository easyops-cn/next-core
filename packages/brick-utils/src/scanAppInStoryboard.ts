import { Storyboard } from "@next-core/brick-types";
import { PrecookHooks } from "./cook";
import {
  visitStoryboardExpressions,
  visitStoryboardFunctions,
} from "./visitStoryboard";
import { EstreeLiteral } from "./cook";

const APP = "APP";
const GET_MENUS = "getMenus";

export function scanAppInStoryboard(storyboard: Storyboard): string[] {
  const collection = new Set<string>();
  const beforeVisitPermissions = beforeVisitAppFactory(collection);
  const { customTemplates, functions } = storyboard.meta ?? {};
  visitStoryboardExpressions(
    [storyboard.routes, customTemplates],
    beforeVisitPermissions,
    APP
  );
  visitStoryboardFunctions(functions, beforeVisitPermissions);
  return Array.from(collection);
}

export function scanAppActionsInAny(data: unknown): string[] {
  const collection = new Set<string>();
  visitStoryboardExpressions(data, beforeVisitAppFactory(collection), APP);
  return Array.from(collection);
}

function beforeVisitAppFactory(
  collection: Set<string>
): PrecookHooks["beforeVisitGlobal"] {
  return function beforeVisitAPP(node, parent): void {
    if (node.name === APP) {
      const memberParent = parent[parent.length - 1];
      const callParent = parent[parent.length - 2];
      if (
        callParent?.node.type === "CallExpression" &&
        callParent?.key === "callee" &&
        memberParent?.node.type === "MemberExpression" &&
        memberParent.key === "object" &&
        !memberParent.node.computed &&
        memberParent.node.property.type === "Identifier" &&
        memberParent.node.property.name === GET_MENUS
      ) {
        for (const arg of callParent.node
          .arguments as unknown as EstreeLiteral[]) {
          if (arg.type === "Literal" && typeof arg.value === "string") {
            collection.add(arg.value);
          }
        }
      }
    }
  };
}
