import { sortBy } from "lodash";
import { BuilderRouteOrBrickNode } from "@easyops/brick-types";
import { BuilderRuntimeEdge, BuilderRuntimeNode } from "../interfaces";
import { getUniqueNodeId } from "./getUniqueNodeId";
import { getBuilderNode } from "./getBuilderNode";
import { setCachedCanvasData } from "./cachedCanvasData";

export function handleBuilderDataInit(root: BuilderRuntimeNode): void {
  const nodes: BuilderRuntimeNode[] = [];
  const edges: BuilderRuntimeEdge[] = [];
  const walk = (node: BuilderRouteOrBrickNode): number => {
    const currentUid = getUniqueNodeId();
    nodes.push(getBuilderNode(node, currentUid));
    if (Array.isArray(node.children)) {
      const sortedChildren = sortBy(node.children, [
        (item) => item.sort ?? -Infinity,
      ]);
      sortedChildren.forEach((child, index) => {
        const childUid = walk(child);
        edges.push({
          child: childUid,
          parent: currentUid,
          mountPoint: child.mountPoint,
          sort: index,
        });
      });
    }
    return currentUid;
  };
  const rootId = walk(root);
  setCachedCanvasData({
    rootId,
    nodes,
    edges,
  });
  return;
}
