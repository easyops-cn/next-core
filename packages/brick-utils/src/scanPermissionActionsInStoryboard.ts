import { CallExpression } from "@babel/types";
import { Storyboard } from "@easyops/brick-types";
import { isObject } from "./isObject";
import { isEvaluable, preevaluate } from "./cook/preevaluate";
import PrecookVisitor from "./cook/PrecookVisitor";

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
        visitors: {
          CallExpression: (node: CallExpression, state, callback) => {
            if (
              node.callee.type === "MemberExpression" &&
              node.callee.object.type === "Identifier" &&
              node.callee.object.name === PERMISSIONS &&
              node.callee.property.type === "Identifier" &&
              node.callee.property.name === check
            ) {
              for (const arg of (node.arguments as unknown) as ESTreeStringLiteral[]) {
                if (arg.type === "Literal" && typeof arg.value === "string") {
                  collection.add(arg.value);
                }
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
        collectPermissionActions(item, collection, memo);
      }
    } else {
      for (const item of Object.values(data)) {
        collectPermissionActions(item, collection, memo);
      }
    }
  }
}
