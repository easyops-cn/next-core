import { Storyboard } from "@next-core/brick-types";
import { PrecookHooks, EstreeLiteral } from "./cook";
import { visitStoryboardExpressions } from "./visitStoryboard";

const APP = "APP";
const GET_MENU = "getMenu";

export function scanAppGetMenuInStoryboard(storyboard: Storyboard): string[] {
  const collection = new Set<string>();
  const beforeVisitApp = beforeVisitAppFactory(collection);
  const { customTemplates } = storyboard.meta ?? {};
  visitStoryboardExpressions(
    [storyboard.routes, customTemplates],
    beforeVisitApp,
    {
      matchExpressionString: matchAppGetMenu,
    }
  );
  // // `APP` is not available in storyboard functions
  return Array.from(collection);
}

export function scanAppGetMenuInAny(data: unknown): string[] {
  const collection = new Set<string>();
  visitStoryboardExpressions(data, beforeVisitAppFactory(collection), {
    matchExpressionString: matchAppGetMenu,
  });
  return Array.from(collection);
}

function matchAppGetMenu(source: string): boolean {
  return source.includes(APP) && source.includes(GET_MENU);
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
        memberParent.node.property.name === GET_MENU
      ) {
        if (callParent.node.arguments.length === 1) {
          const menuId = (
            callParent.node.arguments as unknown as EstreeLiteral[]
          )[0];
          if (menuId.type === "Literal" && typeof menuId.value === "string") {
            collection.add(menuId.value);
          }
        }
      }
    }
  };
}
