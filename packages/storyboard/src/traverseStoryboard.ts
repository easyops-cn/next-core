import type { StoryboardNode, StoryboardNodeRoot } from "./interfaces";

export type TraverseCallback = (node: StoryboardNode) => void;

/** Traverse a storyboard AST. */
export function traverseStoryboard(
  ast: StoryboardNodeRoot,
  callback: TraverseCallback
): void {
  traverseNode(ast, callback);
}

/** Traverse any node(s) in storyboard AST. */
export function traverse(
  nodeOrNodes: StoryboardNode | StoryboardNode[],
  callback: TraverseCallback
): void {
  if (Array.isArray(nodeOrNodes)) {
    traverseNodes(nodeOrNodes, callback);
  } else {
    traverseNode(nodeOrNodes, callback);
  }
}

function traverseNodes(
  nodes: StoryboardNode[],
  callback: TraverseCallback
): void {
  if (!nodes) {
    return;
  }
  for (const node of nodes) {
    traverseNode(node, callback);
  }
}

function traverseNode(node: StoryboardNode, callback: TraverseCallback): void {
  if (!node) {
    return;
  }
  callback(node);
  switch (node.type) {
    case "Root":
      traverseNodes(node.routes, callback);
      traverseNodes(node.templates, callback);
      break;
    case "Route":
      traverseNodes(node.context, callback);
      traverseNode(node.redirect, callback);
      traverseNode(node.menu, callback);
      traverseNodes(node.providers, callback);
      traverseNodes(node.defineResolves, callback);
      traverseNodes(node.children, callback);
      break;
    case "Template":
      traverseNodes(node.bricks, callback);
      traverseNodes(node.context, callback);
      break;
    case "Brick":
      traverseNode(node.if, callback);
      traverseNodes(node.events, callback);
      traverseNodes(node.lifeCycle, callback);
      traverseNodes(node.useBrick, callback);
      traverseNodes(node.useBackend, callback);
      traverseNodes(node.context, callback);
      traverseNodes(node.children, callback);
      break;
    case "Slot":
    case "UseBrickEntry":
    case "UseBackendEntry":
      traverseNodes(node.children, callback);
      break;
    case "Context":
      traverseNode(node.resolve, callback);
      traverseNodes(node.onChange, callback);
      break;
    case "ResolvableCondition":
    case "ResolvableMenu":
      traverseNode(node.resolve, callback);
      break;
    case "ResolveLifeCycle":
      traverseNodes(node.resolves, callback);
      break;
    case "Event":
    case "EventCallback":
    case "SimpleLifeCycle":
    case "ConditionalEvent":
      traverseNodes(node.handlers, callback);
      break;
    case "EventHandler":
      traverseNodes(node.callback, callback);
      break;
    case "ConditionalLifeCycle":
      traverseNodes(node.events, callback);
      break;
    case "BrickMenu":
      traverseNode(node.brick, callback);
      break;
    case "Resolvable":
    case "FalseMenu":
    case "StaticMenu":
    case "UnknownLifeCycle":
    case "LiteralCondition":
      break;
    default:
      // istanbul ignore if
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        throw new Error(`Unhandled storyboard node type: ${node.type}`);
      }
  }
}
