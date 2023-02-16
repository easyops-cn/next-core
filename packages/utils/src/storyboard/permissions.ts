import type { Storyboard } from "@next-core/types";
import type { EstreeLiteral } from "@next-core/cook";
import {
  traverseStoryboardExpressions,
  BeforeVisitGlobal,
} from "./expressions/index.js";
import { traverseStoryboardFunctions } from "./functions/index.js";

const PERMISSIONS = "PERMISSIONS";
const check = "check";

export function scanPermissionActionsInStoryboard(
  storyboard: Storyboard
): string[] {
  const collection = new Set<string>();
  const beforeVisitPermissions = beforeVisitPermissionsFactory(collection);
  const { customTemplates, functions } = storyboard.meta ?? {};
  traverseStoryboardExpressions(
    [storyboard.routes, customTemplates],
    beforeVisitPermissions,
    PERMISSIONS
  );
  traverseStoryboardFunctions(functions, beforeVisitPermissions);
  return Array.from(collection);
}

export function scanPermissionActionsInAny(data: unknown): string[] {
  const collection = new Set<string>();
  traverseStoryboardExpressions(
    data,
    beforeVisitPermissionsFactory(collection),
    PERMISSIONS
  );
  return Array.from(collection);
}

function beforeVisitPermissionsFactory(
  collection: Set<string>
): BeforeVisitGlobal {
  return function beforeVisitPermissions(node, parent): void {
    if (node.name === PERMISSIONS) {
      const memberParent = parent[parent.length - 1];
      const callParent = parent[parent.length - 2];
      if (
        callParent?.node.type === "CallExpression" &&
        callParent?.key === "callee" &&
        memberParent?.node.type === "MemberExpression" &&
        memberParent.key === "object" &&
        (memberParent.node.computed
          ? (memberParent.node.property as any).type === "Literal" &&
            (memberParent.node.property as any).value === check
          : memberParent.node.property.type === "Identifier" &&
            memberParent.node.property.name === check)
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
