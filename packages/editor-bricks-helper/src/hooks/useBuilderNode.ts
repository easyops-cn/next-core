import { useMemo } from "react";
import { BuilderRuntimeNode } from "../interfaces";
import { useBuilderData } from "./useBuilderData";

export function useBuilderNode<P = Record<string, unknown>>({
  nodeUid,
  isRoot,
}: {
  nodeUid?: number;
  isRoot?: boolean;
}): BuilderRuntimeNode<P> {
  const { rootId, nodes } = useBuilderData();
  const currentUid = isRoot ? rootId : nodeUid;
  return useMemo(
    () =>
      nodes.find((node) => node.$$uid === currentUid) as BuilderRuntimeNode<P>,
    [nodes, currentUid]
  );
}
