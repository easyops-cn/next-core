import { useMemo } from "react";
import { sortBy } from "lodash";
import {
  BuilderGroupedChildNode,
  BuilderRuntimeEdge,
  BuilderRuntimeNode,
} from "../interfaces";
import { useBuilderData } from "./useBuilderData";

export function useBuilderGroupedChildNodes({
  nodeUid,
  isRoot,
  doNotExpandTemplates,
}: {
  nodeUid?: number;
  isRoot?: boolean;
  doNotExpandTemplates?: boolean;
}): BuilderGroupedChildNode[] {
  const { rootId, nodes, edges } = useBuilderData();
  return useMemo(
    () =>
      getBuilderGroupedChildNodes({
        nodes,
        edges,
        nodeUid: isRoot ? rootId : nodeUid,
        doNotExpandTemplates,
      }),
    [doNotExpandTemplates, edges, isRoot, nodeUid, nodes, rootId]
  );
}

export function getBuilderGroupedChildNodes({
  nodeUid,
  nodes,
  edges,
  doNotExpandTemplates,
}: {
  nodeUid: number;
  nodes: BuilderRuntimeNode[];
  edges: BuilderRuntimeEdge[];
  doNotExpandTemplates?: boolean;
}): BuilderGroupedChildNode[] {
  const groups = new Map<string, BuilderRuntimeNode[]>();
  const relatedEdges = sortBy(
    edges.filter(
      (edge) =>
        edge.parent === nodeUid &&
        (doNotExpandTemplates
          ? !edge.$$isTemplateInternal
          : !edge.$$isTemplateDelegated)
    ),
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
}
