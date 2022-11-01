import type { StoryboardNode, StoryboardNodeRoot } from "./interfaces";

export type TraverseCallback = (
  node: StoryboardNode,
  path: StoryboardNode[]
) => void;

/** Traverse a storyboard AST. */
export function traverseStoryboard(
  ast: StoryboardNodeRoot,
  callback: TraverseCallback
): void {
  traverseNode(ast, callback, []);
}

/** Traverse any node(s) in storyboard AST. */
export function traverse(
  nodeOrNodes: StoryboardNode | StoryboardNode[],
  callback: TraverseCallback
): void {
  if (Array.isArray(nodeOrNodes)) {
    traverseNodes(nodeOrNodes, callback, []);
  } else {
    traverseNode(nodeOrNodes, callback, []);
  }
}

function traverseNodes(
  nodes: StoryboardNode[],
  callback: TraverseCallback,
  path: StoryboardNode[]
): void {
  if (!nodes) {
    return;
  }
  for (const node of nodes) {
    traverseNode(node, callback, path);
  }
}

function traverseNode(
  node: StoryboardNode,
  callback: TraverseCallback,
  path: StoryboardNode[]
): void {
  if (!node) {
    return;
  }
  callback(node, path);
  const childPath = path.concat(node);
  switch (node.type) {
    case "Root":
      traverseNodes(node.routes, callback, childPath);
      traverseNodes(node.templates, callback, childPath);
      break;
    case "Route":
      traverseNodes(node.context, callback, childPath);
      traverseNode(node.redirect, callback, childPath);
      traverseNode(node.menu, callback, childPath);
      traverseNodes(node.providers, callback, childPath);
      traverseNodes(node.defineResolves, callback, childPath);
      traverseNodes(node.children, callback, childPath);
      break;
    case "Template":
      traverseNodes(node.bricks, callback, childPath);
      traverseNodes(node.context, callback, childPath);
      break;
    case "Brick":
      traverseNode(node.if, callback, childPath);
      traverseNodes(node.events, callback, childPath);
      traverseNodes(node.lifeCycle, callback, childPath);
      traverseNodes(node.useBrick, callback, childPath);
      traverseNodes(node.useBackend, callback, childPath);
      traverseNodes(node.context, callback, childPath);
      traverseNodes(node.children, callback, childPath);
      break;
    case "Slot":
    case "UseBrickEntry":
    case "UseBackendEntry":
      traverseNodes(node.children, callback, childPath);
      break;
    case "Context":
      traverseNode(node.resolve, callback, childPath);
      traverseNodes(node.onChange, callback, childPath);
      break;
    case "ResolvableCondition":
    case "ResolvableMenu":
      traverseNode(node.resolve, callback, childPath);
      break;
    case "ResolveLifeCycle":
      traverseNodes(node.resolves, callback, childPath);
      break;
    case "Event":
    case "EventCallback":
    case "SimpleLifeCycle":
    case "ConditionalEvent":
      traverseNodes(node.handlers, callback, childPath);
      break;
    case "EventHandler":
      traverseNodes(node.callback, callback, childPath);
      break;
    case "ConditionalLifeCycle":
      traverseNodes(node.events, callback, childPath);
      break;
    case "BrickMenu":
      traverseNode(node.brick, callback, childPath);
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
