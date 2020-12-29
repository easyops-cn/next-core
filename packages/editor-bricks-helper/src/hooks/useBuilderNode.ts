import { useMemo } from "react";
import { BuilderRuntimeNode } from "../interfaces";
import { useBuilderData } from "./useBuilderData";

export function useBuilderNode({
  nodeUid,
  isRoot,
}: {
  nodeUid?: number;
  isRoot?: boolean;
}): BuilderRuntimeNode {
  const { rootId, nodes } = useBuilderData();
  const currentUid = isRoot ? rootId : nodeUid;
  return useMemo(() => nodes.find((node) => node.$$uid === currentUid), [
    nodes,
    currentUid,
  ]);
}
