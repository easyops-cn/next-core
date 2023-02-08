import { BrickNode } from "./BrickNode.js";
import { RuntimeBrick } from "./Renderer.js";

export interface MountableElement extends HTMLElement {
  $$rootBricks?: BrickNode[];
}

export function unmountTree(mountPoint: MountableElement): void {
  if (Array.isArray(mountPoint.$$rootBricks)) {
    mountPoint.$$rootBricks.forEach((brick) => {
      brick.unmount();
    });
    mountPoint.$$rootBricks = [];
  }
  mountPoint.innerHTML = "";
}

export function mountTree(
  bricks: RuntimeBrick[],
  mountPoint: MountableElement
): void {
  // Destroy any existing tree
  if (mountPoint.firstChild) {
    unmountTree(mountPoint);
  }

  // Create the top-level internal instance
  const rootBricks = bricks.map((brick) => new BrickNode(brick));

  // Mount the top-level component into the container
  const nodes = rootBricks.map((brick) => brick.mount());
  nodes.forEach((node) => mountPoint.appendChild(node));

  // Save a reference to the internal instance
  mountPoint.$$rootBricks = rootBricks;
}

export function afterMountTree(mountPoint: MountableElement): void {
  if (Array.isArray(mountPoint.$$rootBricks)) {
    mountPoint.$$rootBricks.forEach((brick) => {
      brick.afterMount();
    });
  }
}
