import { BuilderRouteOrBrickNode } from "@next-core/brick-types";
import {
  isBrickNode,
  isCustomTemplateNode,
  isRouteNode,
  isSnippetNode,
} from "./assertions";

describe("assertions", () => {
  it.each<[BuilderRouteOrBrickNode, boolean, boolean, boolean, boolean]>([
    [
      {
        type: "bricks",
        path: "/",
        id: "B-001",
      },
      true,
      false,
      false,
      false,
    ],
    [
      {
        type: "routes",
        path: "/",
        id: "B-001",
      },
      true,
      false,
      false,
      false,
    ],
    [
      {
        type: "redirect",
        path: "/",
        id: "B-001",
      },
      true,
      false,
      false,
      false,
    ],
    [
      {
        type: "brick",
        brick: "any-brick",
        id: "B-001",
      },
      false,
      true,
      false,
      false,
    ],
    [
      {
        type: "provider",
        brick: "any-brick",
        id: "B-001",
      },
      false,
      true,
      false,
      false,
    ],
    [
      {
        type: "template",
        brick: "any-brick",
        id: "B-001",
      },
      false,
      true,
      false,
      false,
    ],
    [
      {
        type: "custom-template",
        templateId: "tpl-any",
        id: "B-001",
      },
      false,
      false,
      true,
      false,
    ],
    [
      {
        type: "snippet",
        snippetId: "snippet-any",
        id: "B-001",
      },
      false,
      false,
      false,
      true,
    ],
  ])(
    "should work with node %j",
    (node, isRoute, isBrick, isCustomTemplate, isSnippet) => {
      expect(isRouteNode(node)).toBe(isRoute);
      expect(isBrickNode(node)).toBe(isBrick);
      expect(isCustomTemplateNode(node)).toBe(isCustomTemplate);
      expect(isSnippetNode(node)).toBe(isSnippet);
    }
  );
});
