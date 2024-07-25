import { Storyboard } from "@next-core/brick-types";
import { EstreeLiteral } from "@next-core/cook";
import { PrecookHooks } from "./cook";
import { visitStoryboardExpressions } from "./visitStoryboard";

const INSTALLED_APPS = "INSTALLED_APPS";
const has = "has";

export function scanInstalledAppsInStoryboard(
  storyboard: Storyboard
): string[] {
  const collection = new Set<string>();
  const beforeVisitInstalledApps = beforeVisitInstalledAppsFactory(collection);
  const { customTemplates, menus } = storyboard.meta ?? {};
  visitStoryboardExpressions(
    [storyboard.routes, customTemplates, menus],
    beforeVisitInstalledApps,
    INSTALLED_APPS
  );
  // `INSTALLED_APPS` is not available in storyboard functions
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
