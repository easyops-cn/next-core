import { Storyboard } from "@next-core/brick-types";
import { EstreeLiteral } from "@next-core/cook";
import { PrecookHooks } from "./cook";
import {
  visitStoryboardExpressions,
  visitStoryboardFunctions,
} from "./visitStoryboard";

const PERMISSIONS = "PERMISSIONS";
const check = "check";

export function scanPermissionActionsInStoryboard(
  storyboard: Storyboard
): string[] {
  const collection = new Set<string>();
  const beforeVisitPermissions = beforeVisitPermissionsFactory(collection);
  const { customTemplates, functions } = storyboard.meta ?? {};
  visitStoryboardExpressions(
    [storyboard.routes, customTemplates],
    beforeVisitPermissions,
    PERMISSIONS
  );
  visitStoryboardFunctions(functions, beforeVisitPermissions, {
    matchSource: (source) => source.includes(PERMISSIONS),
  });
  return Array.from(collection);
}

export function scanPermissionActionsInAny(data: unknown): string[] {
  const collection = new Set<string>();
  visitStoryboardExpressions(
    data,
    beforeVisitPermissionsFactory(collection),
    PERMISSIONS
  );
  return Array.from(collection);
}

function beforeVisitPermissionsFactory(
  collection: Set<string>
): PrecookHooks["beforeVisitGlobal"] {
  return function beforeVisitPermissions(node, parent): void {
    if (node.name === PERMISSIONS) {
      const memberParent = parent[parent.length - 1];
      const callParent = parent[parent.length - 2];
      if (
        callParent?.node.type === "CallExpression" &&
        callParent?.key === "callee" &&
        memberParent?.node.type === "MemberExpression" &&
        memberParent.key === "object" &&
        !memberParent.node.computed &&
        memberParent.node.property.type === "Identifier" &&
        memberParent.node.property.name === check
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
