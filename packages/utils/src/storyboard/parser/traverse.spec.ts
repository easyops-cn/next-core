import {
  traverse,
  traverseStoryboard,
  type TraverseCallback,
} from "./traverse.js";
import type {
  StoryboardNode,
  StoryboardNodeMetaMenu,
  StoryboardNodeRoot,
  StoryboardNodeRoute,
} from "./interfaces.js";

describe("traverse", () => {
  const mockCallback: TraverseCallback = jest.fn();

  it("should handle undefined node", () => {
    traverse(undefined, mockCallback);
    expect(mockCallback).not.toHaveBeenCalled();
  });

  it("should call callback with node and path", () => {
    const node = {
      type: "Root",
      routes: [
        {
          type: "Route",
        },
      ],
    } as Partial<StoryboardNodeRoot> as StoryboardNodeRoot;
    traverse(node, mockCallback);
    expect(mockCallback).toHaveBeenNthCalledWith(1, node, []);
    expect(mockCallback).toHaveBeenNthCalledWith(2, node.routes[0], [node]);
  });

  it("should call callback with node and path for traverseStoryboard", () => {
    const node = {
      type: "Root",
      routes: [
        {
          type: "Route",
        },
      ],
    } as Partial<StoryboardNodeRoot> as StoryboardNodeRoot;
    traverseStoryboard(node, mockCallback);
    expect(mockCallback).toHaveBeenNthCalledWith(1, node, []);
    expect(mockCallback).toHaveBeenNthCalledWith(2, node.routes[0], [node]);
  });

  it("should traverse Route node", () => {
    const node = {
      type: "Route",
      context: [
        {
          type: "Context",
          raw: undefined!,
          resolve: {
            type: "Resolvable",
            raw: undefined!,
          },
        },
      ],
    } as Partial<StoryboardNodeRoute> as StoryboardNodeRoute;
    const contextNode = node.context![0];
    traverse([node], mockCallback);
    expect(mockCallback).toHaveBeenCalledTimes(3);
    expect(mockCallback).toHaveBeenNthCalledWith(1, node, []);
    expect(mockCallback).toHaveBeenNthCalledWith(2, contextNode, [node]);
    expect(mockCallback).toHaveBeenNthCalledWith(3, contextNode.resolve, [
      node,
      contextNode,
    ]);
  });

  it("should traverse Template node", () => {
    const node = {
      type: "Template",
      bricks: [],
      context: [],
    } as Partial<StoryboardNode> as StoryboardNode;
    traverse(node, mockCallback);
    expect(mockCallback).toHaveBeenCalledTimes(1);
  });

  it("should traverse Brick node", () => {
    const node = {
      type: "Brick",
    } as Partial<StoryboardNode> as StoryboardNode;
    traverse(node, mockCallback);
    expect(mockCallback).toHaveBeenCalledTimes(1);
  });

  it("should traverse Slot node", () => {
    const node = {
      type: "Slot",
      children: [],
    } as Partial<StoryboardNode> as StoryboardNode;
    traverse(node, mockCallback);
    expect(mockCallback).toHaveBeenCalledTimes(1);
  });

  it("should traverse Context node", () => {
    const node = {
      type: "Context",
      resolve: undefined,
      onChange: [],
    } as Partial<StoryboardNode> as StoryboardNode;
    traverse(node, mockCallback);
    expect(mockCallback).toHaveBeenCalledTimes(1);
  });

  it("should traverse ResolvableCondition node", () => {
    const node: StoryboardNode = {
      type: "ResolvableCondition",
      resolve: undefined,
    };
    traverse(node, mockCallback);
    expect(mockCallback).toHaveBeenCalledTimes(1);
  });

  it("should traverse ResolveLifeCycle node", () => {
    const node = {
      type: "ResolveLifeCycle",
      resolves: [],
    } as Partial<StoryboardNode> as StoryboardNode;
    traverse(node, mockCallback);
    expect(mockCallback).toHaveBeenCalledTimes(1);
  });

  it("should traverse Event node", () => {
    const node: StoryboardNode = { type: "Event", handlers: [] };
    traverse(node, mockCallback);
    expect(mockCallback).toHaveBeenCalledTimes(1);
  });

  it("should traverse EventHandler node", () => {
    const node: StoryboardNode = {
      type: "EventHandler",
      callback: [],
      then: [],
      else: [],
    };
    traverse(node, mockCallback);
    expect(mockCallback).toHaveBeenCalledTimes(1);
  });

  it("should traverse ConditionalLifeCycle node", () => {
    const node = {
      type: "ConditionalLifeCycle",
      events: [],
      name: "onMessage",
    } as StoryboardNode;
    traverse(node, mockCallback);
    expect(mockCallback).toHaveBeenCalledTimes(1);
  });

  it("should traverse BrickMenu node", () => {
    const node = { type: "BrickMenu", brick: undefined } as StoryboardNode;
    traverse(node, mockCallback);
    expect(mockCallback).toHaveBeenCalledTimes(1);
  });

  it("should traverse MetaMenu node", () => {
    const node = {
      type: "MetaMenu",
      items: [
        {
          type: "MetaMenuItem",
          children: [],
          raw: undefined!,
        },
      ],
    } as Partial<StoryboardNodeMetaMenu> as StoryboardNodeMetaMenu;
    traverse(node, mockCallback);
    expect(mockCallback).toHaveBeenCalledTimes(2);
    expect(mockCallback).toHaveBeenNthCalledWith(1, node, []);
    expect(mockCallback).toHaveBeenNthCalledWith(2, node.items![0], [node]);
  });

  it("should handle unknown node type", () => {
    const node: StoryboardNode = { type: "UnknownType" as any };
    traverse(node, mockCallback);
    expect(mockCallback).toHaveBeenCalledTimes(1);
  });
});
