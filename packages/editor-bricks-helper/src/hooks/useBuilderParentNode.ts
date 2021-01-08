import { useMemo } from "react";
import { BuilderRuntimeNode } from "../interfaces";
import { useBuilderData } from "./useBuilderData";

export function useBuilderParentNode(nodeUid: number): BuilderRuntimeNode {
  const { nodes, edges } = useBuilderData();
  return useMemo(() => {
    const parentUid = edges.find((edge) => edge.child === nodeUid).parent;
    return nodes.find((node) => node.$$uid === parentUid);
  }, [edges, nodeUid, nodes]);
}
