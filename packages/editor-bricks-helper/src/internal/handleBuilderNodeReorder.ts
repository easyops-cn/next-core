import { EventDetailOfNodeReorder } from "../interfaces";
import { getCachedCanvasData, setCachedCanvasData } from "./cachedCanvasData";
import { reorderBuilderEdges } from "./reorderBuilderEdges";

export function handleBuilderNodeReorder(
  detail: EventDetailOfNodeReorder
): void {
  const { rootId, nodes, edges } = getCachedCanvasData();
  const { nodeUids, parentUid } = detail;
  setCachedCanvasData({
    rootId,
    nodes,
    edges: reorderBuilderEdges(edges, parentUid, nodeUids),
  });
}
