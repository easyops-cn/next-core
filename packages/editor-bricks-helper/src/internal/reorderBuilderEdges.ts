import { BuilderRuntimeEdge } from "../interfaces";

export function reorderBuilderEdges(
  edges: BuilderRuntimeEdge[],
  parentUid: number,
  mountPoint: string,
  nodeUids: number[]
): BuilderRuntimeEdge[] {
  return edges.map((edge) => {
    // `nodeUids` are sorted, so reorder related edges based on it.
    const index =
      edge.parent === parentUid && edge.mountPoint === mountPoint
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
