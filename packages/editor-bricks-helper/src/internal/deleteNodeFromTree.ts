import { BuilderCanvasData, BuilderRuntimeEdge } from "../interfaces";

export function deleteNodeFromTree(
  nodeUid: number,
  { rootId, nodes, edges }: BuilderCanvasData
): BuilderCanvasData {
  const idsToDelete = new Set<number>();
  collectIdsToDelete(nodeUid, edges, idsToDelete);
  return {
    rootId,
    nodes: nodes.filter((node) => !idsToDelete.has(node.$$uid)),
    edges: edges.filter(
      (edge) => !idsToDelete.has(edge.parent) && !idsToDelete.has(edge.child)
    ),
  };
}

function collectIdsToDelete(
  nodeUid: number,
  edges: BuilderRuntimeEdge[],
  idsToDelete: Set<number>
): void {
  idsToDelete.add(nodeUid);
  const ids: number[] = [];
  for (const edge of edges) {
    if (edge.parent === nodeUid) {
      ids.push(edge.child);
    }
  }
  for (const id of ids) {
    collectIdsToDelete(id, edges, idsToDelete);
  }
}
