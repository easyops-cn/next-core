import { sortBy } from "lodash";
import {
  BuilderRouteOrBrickNode,
  BuilderCustomTemplateNode,
} from "@next-core/brick-types";
import { BuilderRuntimeEdge, BuilderRuntimeNode } from "../interfaces";
import { getBuilderNode } from "./getBuilderNode";
import { getUniqueNodeId } from "./getUniqueNodeId";
import { isBrickNode } from "../assertions";

export function getAppendingNodesAndEdges(
  nodeData: BuilderRouteOrBrickNode,
  nodeUid: number,
  templateSourceMap: Map<string, BuilderCustomTemplateNode>
): {
  nodes: BuilderRuntimeNode[];
  edges: BuilderRuntimeEdge[];
} {
  const nodes: BuilderRuntimeNode[] = [];
  const edges: BuilderRuntimeEdge[] = [];
  const walk = (
    nodeData: BuilderRouteOrBrickNode,
    currentUid: number,
    processedTemplateSet: Set<string>,
    isTemplateInternalNode?: boolean,
    inheritedTemplateRefToUid?: Map<string, number>
  ): void => {
    const builderNode = getBuilderNode(
      nodeData,
      currentUid,
      isTemplateInternalNode
    );
    nodes.push(builderNode);

    if (inheritedTemplateRefToUid && builderNode.ref) {
      inheritedTemplateRefToUid.set(builderNode.ref as string, currentUid);
    }

    let templateSource: BuilderCustomTemplateNode;

    if (
      isBrickNode(builderNode) &&
      !builderNode.brick.includes(".") &&
      builderNode.brick.startsWith("tpl-") &&
      !processedTemplateSet.has(builderNode.brick) &&
      (templateSource = templateSourceMap?.get(builderNode.brick)) &&
      templateSource.children?.length > 0
    ) {
      // Avoid nesting the same templates.
      processedTemplateSet.add(builderNode.brick);
      builderNode.$$isExpandableTemplate = true;
      builderNode.$$templateProxy =
        templateSource.proxy && JSON.parse(templateSource.proxy);
      const templateRefToUid = new Map<string, number>();
      builderNode.$$templateRefToUid = templateRefToUid;

      const sortedChildren = sortBy(templateSource.children, [
        (item) => item.sort ?? -Infinity,
      ]);
      sortedChildren.forEach((child, index) => {
        const childUid = getUniqueNodeId();
        walk(child, childUid, processedTemplateSet, true, templateRefToUid);
        edges.push({
          child: childUid,
          parent: currentUid,
          mountPoint: "",
          sort: index,
          $$isTemplateInternal: true,
        });
      });
    }

    if (Array.isArray(nodeData.children)) {
      // For routes and custom-templates, their children are fixed
      // and mount points should be ignored. To unify tree edge
      // data structure, just override their mount points.
      let overrideChildrenMountPoint: string;
      switch (builderNode.type) {
        case "bricks":
        case "custom-template":
          overrideChildrenMountPoint = "bricks";
          break;
        case "routes":
          overrideChildrenMountPoint = "routes";
          break;
      }
      const sortedChildren = sortBy(nodeData.children, [
        (item) => item.sort ?? -Infinity,
      ]);
      sortedChildren.forEach((child, index) => {
        const childUid = getUniqueNodeId();
        walk(
          child,
          childUid,
          processedTemplateSet,
          isTemplateInternalNode,
          inheritedTemplateRefToUid
        );
        edges.push({
          child: childUid,
          parent: currentUid,
          mountPoint: overrideChildrenMountPoint ?? child.mountPoint,
          sort: index,
          $$isTemplateInternal: isTemplateInternalNode,
          $$isTemplateDelegated: builderNode.$$isExpandableTemplate,
        });
      });
    }
  };
  walk(nodeData, nodeUid, new Set());
  return {
    nodes,
    edges,
  };
}
