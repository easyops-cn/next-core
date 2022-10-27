import { sortBy } from "lodash";
import { hasOwnProperty } from "@next-core/brick-utils";
import {
  BuilderRouteOrBrickNode,
  BuilderCustomTemplateNode,
  CustomTemplateProxyProperty,
  CustomTemplateProxyBasicProperty,
  Story,
  TemplateLayoutType,
} from "@next-core/brick-types";
import { BuilderRuntimeEdge, BuilderRuntimeNode } from "../interfaces";
import { getBuilderNode } from "./getBuilderNode";
import { getUniqueNodeId } from "./getUniqueNodeId";
import { isBrickNode } from "../assertions";

export function getAppendingNodesAndEdges(
  nodeData: BuilderRouteOrBrickNode,
  nodeUid: number,
  templateSourceMap: Map<string, BuilderCustomTemplateNode>,
  storyList: Story[] = [],
  isRoot?: boolean
): {
  nodes: BuilderRuntimeNode[];
  edges: BuilderRuntimeEdge[];
  wrapperNode?: BuilderRuntimeNode;
} {
  const nodes: BuilderRuntimeNode[] = [];
  const edges: BuilderRuntimeEdge[] = [];
  let wrapperNode: BuilderRuntimeNode;

  const walk = (
    nodeData: BuilderRouteOrBrickNode,
    currentUid: number,
    processedTemplateSet: Set<string>,
    isTemplateInternalNode?: boolean,
    inheritedTemplateRefToUid?: Map<string, number>,
    layoutType?: TemplateLayoutType
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
      if (templateSource.layoutType === "wrapper") {
        builderNode.layoutType = "wrapper";
      }
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
        walk(
          child,
          childUid,
          // Each child should be a branch.
          new Set(processedTemplateSet),
          true,
          templateRefToUid,
          layoutType
        );
        edges.push({
          child: childUid,
          parent: currentUid,
          mountPoint: "",
          sort: index,
          $$isTemplateInternal: true,
        });
      });

      if (!builderNode.$$isTemplateInternalNode) {
        // Here all internal nodes of the template including nested templates are ready.
        const processDelegatingSlots = (
          cursorNode: BuilderRuntimeNode,
          mountPoint?: string,
          rootMountPoint?: string
        ): void => {
          if (cursorNode.$$templateProxy?.slots) {
            const slotEntries = Object.entries(
              cursorNode.$$templateProxy?.slots
            ).filter(
              (entry) => mountPoint === undefined || entry[0] === mountPoint
            );
            for (const [slotName, slotConf] of slotEntries) {
              const refUid = cursorNode.$$templateRefToUid.get(slotConf.ref);
              if (refUid) {
                const refNode = nodes.find((node) => node.$$uid === refUid);
                if (refNode.$$isExpandableTemplate) {
                  processDelegatingSlots(refNode, slotConf.refSlot, slotName);
                } else {
                  if (!refNode.$$delegatedSlots) {
                    refNode.$$delegatedSlots = new Map();
                  }
                  let delegatedSlotsByRefSlot = refNode.$$delegatedSlots.get(
                    slotConf.refSlot
                  );
                  if (!delegatedSlotsByRefSlot) {
                    delegatedSlotsByRefSlot = [];
                    refNode.$$delegatedSlots.set(
                      slotConf.refSlot,
                      delegatedSlotsByRefSlot
                    );
                  }
                  delegatedSlotsByRefSlot.push({
                    templateUid: builderNode.$$uid,
                    templateMountPoint: rootMountPoint || slotName,
                  });
                }
              }
            }
          }
        };
        processDelegatingSlots(builderNode);

        const processDelegatingProperties = (
          cursorNode: BuilderRuntimeNode,
          previousPropertyName?: string
        ): void => {
          if (cursorNode.$$templateProxy?.properties) {
            const propertyEntries = Object.entries(
              cursorNode.$$templateProxy?.properties
            ).filter(
              (entry) =>
                previousPropertyName === undefined ||
                entry[0] === previousPropertyName
            );
            for (const [propertyName, propertyConf] of propertyEntries) {
              if (
                hasOwnProperty(cursorNode.$$parsedProperties, propertyName) &&
                isBasicRefProperty(propertyConf)
              ) {
                const refUid = cursorNode.$$templateRefToUid.get(
                  propertyConf.ref
                );
                const propertyValue =
                  cursorNode.$$parsedProperties[propertyName];
                if (refUid) {
                  const refNode = nodes.find((node) => node.$$uid === refUid);
                  refNode.$$parsedProperties[propertyConf.refProperty] =
                    propertyValue;
                  if (refNode.$$isExpandableTemplate) {
                    processDelegatingProperties(
                      refNode,
                      propertyConf.refProperty
                    );
                  }
                }
              }
            }
          }
        };
        processDelegatingProperties(builderNode);
      }
    }

    if (Array.isArray(nodeData.children)) {
      // For routes and custom-templates, their children are fixed
      // and mount points should be ignored. To unify tree edge
      // data structure, just override their mount points.
      let overrideChildrenMountPoint: string;
      switch (builderNode.type) {
        case "bricks":
        case "custom-template":
        case "snippet":
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
          // Each child should be a branch.
          new Set(processedTemplateSet),
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
  for (let i = 0; i < nodes.length; i++) {
    // 布局模板属于第一层
    const item = nodes[i];
    if (
      item.layoutType === "wrapper" &&
      isRoot &&
      edges.find((edge) => edge.child === item.$$uid).parent === nodeUid
    ) {
      if (!wrapperNode) {
        wrapperNode = item;
      }
      break;
    }
  }
  return {
    nodes,
    edges,
    wrapperNode,
  };
}

export function isBasicRefProperty(
  propRef: CustomTemplateProxyProperty
): propRef is CustomTemplateProxyBasicProperty {
  return (
    !!(propRef as CustomTemplateProxyBasicProperty).ref &&
    !!(propRef as CustomTemplateProxyBasicProperty).refProperty
  );
}
