import { EventDetailOfNodeAddStored } from "../interfaces";
import { getCachedCanvasData, setCachedCanvasData } from "./cachedCanvasData";
import { getBuilderNode } from "./getBuilderNode";

export function handleBuilderNodeAddStored(
  detail: EventDetailOfNodeAddStored
): void {
  const { rootId, nodes, edges } = getCachedCanvasData();
  const { nodeUid, nodeAlias, nodeData } = detail;
  setCachedCanvasData({
    rootId,
    nodes: nodes.map((node) =>
      node.$$uid === nodeUid
        ? getBuilderNode(nodeData, nodeUid, nodeAlias)
        : node
    ),
    edges,
  });
}
