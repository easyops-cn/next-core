import { Storyboard } from "@next-core/brick-types";
import { isObject } from "./isObject";
import { isEvaluable, preevaluate } from "./cook";

const PERMISSIONS = "PERMISSIONS";
const check = "check";

interface ESTreeStringLiteral {
  type: "Literal";
  value: string;
}

export function scanPermissionActionsInStoryboard(
  storyboard: Storyboard
): string[] {
  return scanPermissionActionsInAny([
    storyboard.routes,
    storyboard.meta?.customTemplates,
  ]);
}

export function scanPermissionActionsInAny(data: unknown): string[] {
  const collection = new Set<string>();
  collectPermissionActions(data, collection);
  return Array.from(collection);
}

function collectPermissionActions(
  data: unknown,
  collection: Set<string>,
  memo = new WeakSet()
): void {
  if (typeof data === "string") {
    if (data.includes(PERMISSIONS) && isEvaluable(data)) {
      preevaluate(data, {
        withParent: true,
        hooks: {
          beforeVisitGlobal(node, parent): void {
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
                  .arguments as unknown as ESTreeStringLiteral[]) {
                  if (arg.type === "Literal" && typeof arg.value === "string") {
                    collection.add(arg.value);
                  }
                }
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
        collectPermissionActions(item, collection, memo);
      }
    } else {
      for (const item of Object.values(data)) {
        collectPermissionActions(item, collection, memo);
      }
    }
  }
}
