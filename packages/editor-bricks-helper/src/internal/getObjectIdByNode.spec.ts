import { BuilderRuntimeNode } from "../interfaces";
import { getObjectIdByNode } from "./getObjectIdByNode";

describe("getObjectIdByNode", () => {
  it.each<[BuilderRuntimeNode, string]>([
    [
      {
        type: "brick",
      } as BuilderRuntimeNode,
      "STORYBOARD_BRICK",
    ],
    [
      {
        type: "provider",
      } as BuilderRuntimeNode,
      "STORYBOARD_BRICK",
    ],
    [
      {
        type: "template",
      } as BuilderRuntimeNode,
      "STORYBOARD_BRICK",
    ],
    [
      {
        type: "routes",
      } as BuilderRuntimeNode,
      "STORYBOARD_ROUTE",
    ],
    [
      {
        type: "bricks",
      } as BuilderRuntimeNode,
      "STORYBOARD_ROUTE",
    ],
    [
      {
        type: "redirect",
      } as BuilderRuntimeNode,
      "STORYBOARD_ROUTE",
    ],
    [
      {
        type: "custom-template",
      } as BuilderRuntimeNode,
      "STORYBOARD_TEMPLATE",
    ],
  ])("should work", (node, result) => {
    expect(getObjectIdByNode(node)).toEqual(result);
  });
});
