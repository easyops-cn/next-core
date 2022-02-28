import { useMemo } from "react";
import { BuilderRuntimeNode } from "../interfaces";
import { useBuilderData } from "./useBuilderData";

export function useBuilderNode<P = Record<string, unknown>>({
  nodeUid,
  isRoot,
  isWrapper,
}: {
  nodeUid?: number;
  isRoot?: boolean;
  isWrapper?: boolean;
}): BuilderRuntimeNode<P> {
  const { rootId, nodes, wrapperNode } = useBuilderData();
  const currentUid = isRoot ? rootId : nodeUid;
  return useMemo(() => {
    if (isWrapper) {
      return wrapperNode as BuilderRuntimeNode<P>;
    }
    return nodes.find(
      (node) => node.$$uid === currentUid
    ) as BuilderRuntimeNode<P>;
  }, [nodes, currentUid, isWrapper, wrapperNode]);
}
