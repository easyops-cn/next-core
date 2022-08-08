import { Storyboard } from "@next-core/brick-types";
import { EstreeLiteral } from "@next-core/cook";
import { PrecookHooks } from "./cook";
import {
  visitStoryboardExpressions,
  visitStoryboardFunctions,
} from "./visitStoryboard";

const INSTALLED_APPS = "INSTALLED_APPS";
const has = "has";

export function scanInstalledAppsInStoryboard(
  storyboard: Storyboard
): string[] {
  const collection = new Set<string>();
  const beforeVisitInstalledApps = beforeVisitInstalledAppsFactory(collection);
  const { customTemplates, functions } = storyboard.meta ?? {};
  visitStoryboardExpressions(
    [storyboard.routes, customTemplates],
    beforeVisitInstalledApps,
    INSTALLED_APPS
  );
  visitStoryboardFunctions(functions, beforeVisitInstalledApps);
  return Array.from(collection);
}

function beforeVisitInstalledAppsFactory(
  collection: Set<string>
): PrecookHooks["beforeVisitGlobal"] {
  return function beforeVisitPermissions(node, parent): void {
    if (node.name === INSTALLED_APPS) {
      const memberParent = parent[parent.length - 1];
      const callParent = parent[parent.length - 2];
      if (
        callParent?.node.type === "CallExpression" &&
        callParent?.key === "callee" &&
        memberParent?.node.type === "MemberExpression" &&
        memberParent.key === "object" &&
        !memberParent.node.computed &&
        memberParent.node.property.type === "Identifier" &&
        memberParent.node.property.name === has
      ) {
        const args = callParent.node.arguments as unknown as EstreeLiteral[];
        if (
          args.length > 0 &&
          args[0].type === "Literal" &&
          typeof args[0].value === "string"
        ) {
          collection.add(args[0].value);
        }
      }
    }
  };
}
