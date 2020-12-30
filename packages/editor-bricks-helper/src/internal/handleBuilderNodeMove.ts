import { EventDetailOfNodeMove } from "../interfaces";
import { getCachedCanvasData, setCachedCanvasData } from "./cachedCanvasData";
import { reorderBuilderEdges } from "./reorderBuilderEdges";

export function handleBuilderNodeMove(detail: EventDetailOfNodeMove): void {
  const { rootId, nodes, edges } = getCachedCanvasData();
  const { nodeUid, parentUid, nodeUids, nodeData } = detail;
  setCachedCanvasData({
    rootId,
    nodes,
    edges: reorderBuilderEdges(
      edges
        .filter((edge) => edge.child !== nodeUid)
        .concat({
          parent: parentUid,
          child: nodeUid,
          mountPoint: nodeData.mountPoint,
          sort: undefined,
        }),
      parentUid,
      nodeUids
    ),
  });
}
