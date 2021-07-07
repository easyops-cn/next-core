import { BuilderCanvasData, BuilderRuntimeEdge } from "../interfaces";
import { expandTemplateEdges } from "./expandTemplateEdges";

export function reorderBuilderEdges(
  { rootId, nodes, edges }: BuilderCanvasData,
  {
    parentUid,
    nodeUids,
  }: {
    parentUid: number;
    nodeUids: number[];
  }
): BuilderRuntimeEdge[] {
  // When we do edge-reordering, we simply remove existed
  // expanded edges and re-expand them.
  const edgesExcludeExpanded = edges.filter(
    (edge) => !edge.$$isTemplateExpanded
  );

  return expandTemplateEdges({
    rootId,
    nodes,
    edges: edgesExcludeExpanded.map((edge) => {
      // `nodeUids` are sorted, so reorder related edges based on it.
      const index =
        edge.parent === parentUid ? nodeUids.indexOf(edge.child) : -1;
      return index >= 0
        ? {
            ...edge,
            sort: index,
          }
        : edge;
    }),
  });
}
