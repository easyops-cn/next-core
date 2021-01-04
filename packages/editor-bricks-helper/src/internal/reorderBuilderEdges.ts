import { BuilderRuntimeEdge } from "../interfaces";

export function reorderBuilderEdges(
  edges: BuilderRuntimeEdge[],
  parentUid: number,
  nodeUids: number[]
): BuilderRuntimeEdge[] {
  return edges.map((edge) => {
    // `nodeUids` are sorted, so reorder related edges based on it.
    const index =
      edge.parent === parentUid
        ? nodeUids.findIndex((uid) => edge.child === uid)
        : -1;
    return index >= 0
      ? {
          ...edge,
          sort: index,
        }
      : edge;
  });
}
