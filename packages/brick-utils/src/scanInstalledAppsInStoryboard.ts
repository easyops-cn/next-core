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
  const { customTemplates, functions, menus } = storyboard.meta ?? {};
  visitStoryboardExpressions(
    [storyboard.routes, customTemplates, menus],
    beforeVisitInstalledApps,
    INSTALLED_APPS
  );
  visitStoryboardFunctions(functions, beforeVisitInstalledApps);
  return Array.from(collection);
}

function visitInstalledAppsArguments(collection: Set<string>, node: any): void {
  const visitLogicalExpression = (node: any): void => {
    if (node.type === "LogicalExpression" && node.operator) {
      if (node.left.type === "Literal" && typeof node.left.value === "string") {
        collection.add(node.left.value);
      }
      if (
        node.right.type === "Literal" &&
        typeof node.right.value === "string"
      ) {
        collection.add(node.right.value);
      }
      if (node.left.type === "LogicalExpression") {
        visitInstalledAppsArguments(collection, node.left);
      }
      if (node.right.type === "LogicalExpression") {
        visitInstalledAppsArguments(collection, node.right);
      }
      if (node.left.type === "ConditionalExpression") {
        visitInstalledAppsArguments(collection, node.left);
      }
      if (node.right.type === "ConditionalExpression") {
        visitInstalledAppsArguments(collection, node.right);
      }
    }
  };
  const visitConditionalExpression = (node: any): void => {
    if (node.type === "ConditionalExpression") {
      if (
        node.alternate?.type === "Literal" &&
        typeof node.alternate?.value === "string"
      ) {
        collection.add(node.alternate.value);
      }
      if (
        node.consequent?.type === "Literal" &&
        typeof node.consequent?.value === "string"
      ) {
        collection.add(node.consequent.value);
      }
      if (node.alternate.type === "ConditionalExpression") {
        visitInstalledAppsArguments(collection, node.alternate);
      }
      if (node.consequent?.type === "ConditionalExpression") {
        visitInstalledAppsArguments(collection, node.consequent);
      }
      if (node.alternate.type === "LogicalExpression") {
        visitLogicalExpression(node.alternate);
      }
      if (node.consequent.type === "LogicalExpression") {
        visitLogicalExpression(node.consequent);
      }
    }
  };
  visitConditionalExpression(node);
  visitLogicalExpression(node);
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
        if (args.length > 0) {
          visitInstalledAppsArguments(collection, args[0]);
        }
      }
    }
  };
}
