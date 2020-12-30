import { useMemo } from "react";
import { sortBy } from "lodash";
import { BuilderRuntimeNode } from "../interfaces";
import { useBuilderData } from "./useBuilderData";

export function useBuilderMountPointChildNodes({
  nodeUid,
  isRoot,
  mountPoint,
}: {
  nodeUid?: number;
  isRoot?: boolean;
  mountPoint: string;
}): BuilderRuntimeNode[] {
  const { rootId, nodes, edges } = useBuilderData();
  const currentUid = isRoot ? rootId : nodeUid;
  return useMemo(() => {
    const relatedEdges = sortBy(
      edges.filter(
        (edge) => edge.parent === currentUid && edge.mountPoint === mountPoint
      ),
      [(edge) => edge.sort]
    );
    const childNodes = relatedEdges.map((edge) =>
      nodes.find((node) => node.$$uid === edge.child)
    );
    return childNodes;
  }, [edges, nodes, currentUid, mountPoint]);
}
