import { useMemo } from "react";
import { sortBy } from "lodash";
import { useBuilderData } from "./useBuilderData";

export function useBuilderNodeMountPoints({
  nodeUid,
  isRoot,
}: {
  nodeUid?: number;
  isRoot?: boolean;
}): string[] {
  const { rootId, edges } = useBuilderData();
  const currentUid = isRoot ? rootId : nodeUid;
  return useMemo(() => {
    const mountPoints = new Set<string>();
    const relatedEdges = sortBy(
      edges.filter((edge) => edge.parent === currentUid),
      [(edge) => edge.sort]
    );
    for (const edge of relatedEdges) {
      mountPoints.add(edge.mountPoint);
    }
    return Array.from(mountPoints);
  }, [currentUid, edges]);
}
