import { useMemo } from "react";
import { sortBy } from "lodash";
import { BuilderGroupedChildNode, BuilderRuntimeNode } from "../interfaces";
import { useBuilderData } from "./useBuilderData";

export function useBuilderGroupedChildNodes({
  nodeUid,
  isRoot,
}: {
  nodeUid?: number;
  isRoot?: boolean;
}): BuilderGroupedChildNode[] {
  const { rootId, nodes, edges } = useBuilderData();
  const currentUid = isRoot ? rootId : nodeUid;
  return useMemo(() => {
    const groups = new Map<string, BuilderRuntimeNode[]>();
    const relatedEdges = sortBy(
      edges.filter((edge) => edge.parent === currentUid),
      [(edge) => edge.sort]
    );
    for (const edge of relatedEdges) {
      const childNode = nodes.find((node) => node.$$uid === edge.child);
      if (groups.has(edge.mountPoint)) {
        groups.get(edge.mountPoint).push(childNode);
      } else {
        groups.set(edge.mountPoint, [childNode]);
      }
    }
    return Array.from(groups.entries()).map(([mountPoint, childNodes]) => ({
      mountPoint,
      childNodes,
    }));
  }, [edges, nodes, currentUid]);
}
