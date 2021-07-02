import { developHelper } from "@next-core/brick-kit";
import { isBrickNode, isRouteNode } from "../assertions";
import { BuilderRuntimeNode } from "../interfaces";

const ANY_BRICK_EDITOR = "basic-bricks.any-brick--editor";
const ANY_ROUTE_EDITOR = "basic-bricks.any-route--editor";

/**
 * Get editor brick name by node.
 *
 * @param node - Builder node.
 * @param editor - Using shared editor.
 *
 * @returns
 *
 * Returns editor brick name if the node is a brick, will fallback to `basic-bricks.any-brick--editor`
 * if the relevant editor brick is not found.
 *
 * Or returns `basic-bricks.any-route--editor` if the node is a route.
 *
 * And returns undefined if load failed.
 */
export async function getEditorBrick(
  node: BuilderRuntimeNode,
  editor?: string
): Promise<string> {
  const tryEditorBricks: string[] = [];
  if (isRouteNode(node)) {
    tryEditorBricks.push(ANY_ROUTE_EDITOR);
  } else if (isBrickNode(node)) {
    if (node.brick.includes("-")) {
      tryEditorBricks.push(`${node.brick}--editor`);
    }

    if (editor) {
      tryEditorBricks.push(editor);
    }

    tryEditorBricks.push(ANY_BRICK_EDITOR);
  } else {
    // Currently there should be no custom-template nodes to be rendered as editor.
    throw new Error(`Unsupported node type: ${node.type}`);
  }

  for (const editorBrick of tryEditorBricks) {
    try {
      await developHelper.loadEditorBricks([editorBrick]);
    } catch (error) {
      throw new Error(`Load editor brick "${editorBrick}" failed`);
    }
    if (customElements.get(editorBrick)) {
      return editorBrick;
    }
  }

  throw new Error(`Editor brick "${tryEditorBricks.join(", ")}" not found`);
}
