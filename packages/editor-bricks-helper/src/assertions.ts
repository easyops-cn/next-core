import {
  BuilderBrickNode,
  BuilderCustomTemplateNode,
  BuilderRouteNode,
  BuilderRouteOrBrickNode,
} from "@next-core/brick-types";

export function isRouteNode(
  node: BuilderRouteOrBrickNode
): node is BuilderRouteNode {
  switch (node.type) {
    case "bricks":
    case "routes":
    case "redirect":
      return true;
    default:
      return false;
  }
}

export function isBrickNode(
  node: BuilderRouteOrBrickNode
): node is BuilderBrickNode {
  switch (node.type) {
    case "brick":
    case "provider":
    case "template":
      return true;
    default:
      return false;
  }
}

export function isCustomTemplateNode(
  node: BuilderRouteOrBrickNode
): node is BuilderCustomTemplateNode {
  return node.type === "custom-template";
}
