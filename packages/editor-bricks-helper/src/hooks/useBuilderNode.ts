import { useMemo } from "react";
import { BuilderRuntimeNode } from "../interfaces";
import { useBuilderData } from "./useBuilderData";

export function useBuilderNode<P = Record<string, unknown>>({
  nodeUid,
  isRoot,
  useWrapper,
}: {
  nodeUid?: number;
  isRoot?: boolean;
  useWrapper?: boolean;
}): BuilderRuntimeNode<P> {
  const { rootId, nodes, wrapperNode } = useBuilderData();
  const currentUid = isRoot ? rootId : nodeUid;
  return useMemo(() => {
    if (useWrapper) {
      return wrapperNode as BuilderRuntimeNode<P>;
    }
    return nodes.find(
      (node) => node.$$uid === currentUid
    ) as BuilderRuntimeNode<P>;
  }, [nodes, currentUid, useWrapper, wrapperNode]);
}
