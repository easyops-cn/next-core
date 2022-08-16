import { BuilderRuntimeNode } from "../interfaces";
import {
  isRouteNode,
  isBrickNode,
  isCustomTemplateNode,
  isSnippetNode,
} from "@next-core/brick-utils";

export const getObjectIdByNode = (node: BuilderRuntimeNode): string => {
  if (isRouteNode(node)) return "STORYBOARD_ROUTE";
  if (isBrickNode(node)) return "STORYBOARD_BRICK";
  if (isCustomTemplateNode(node)) return "STORYBOARD_TEMPLATE";
  if (isSnippetNode(node)) return "STORYBOARD_SNIPPET";
};
