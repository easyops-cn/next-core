import { EventDetailOfNodeAdd } from "../interfaces";
import { getCachedCanvasData, setCachedCanvasData } from "./cachedCanvasData";
import { reorderBuilderEdges } from "./reorderBuilderEdges";

export function handleBuilderNodeAdd(detail: EventDetailOfNodeAdd): void {
  const { rootId, nodes, edges } = getCachedCanvasData();
  const { nodeUid, parentUid, nodeUids, nodeAlias, nodeData } = detail;
  setCachedCanvasData({
    rootId,
    nodes: nodes.concat({
      ...(nodeData as any),
      alias: nodeAlias,
      $$uid: nodeUid,
    }),
    edges: reorderBuilderEdges(
      edges.concat({
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
