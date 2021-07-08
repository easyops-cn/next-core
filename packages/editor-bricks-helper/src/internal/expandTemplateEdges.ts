import { clamp, sortBy } from "lodash";
import { CustomTemplateProxySlot } from "@next-core/brick-types";
import { hasOwnProperty } from "@next-core/brick-utils";
import {
  BuilderCanvasData,
  BuilderRuntimeEdge,
  BuilderRuntimeNode,
} from "../interfaces";

export function expandTemplateEdges({
  nodes,
  // Here expanded edges should be excluded.
  edges,
  rootId,
}: BuilderCanvasData): BuilderRuntimeEdge[] {
  const newEdges = edges.slice();
  const reorderedEdgesMap = new WeakMap<BuilderRuntimeEdge, number>();

  const walk = (
    uid: number,
    callback: (
      node: BuilderRuntimeNode,
      childEdges: BuilderRuntimeEdge[]
    ) => void
  ): void => {
    const node = nodes.find((item) => item.$$uid === uid);
    const childEdges = sortBy(
      edges.filter((edge) => edge.parent === node.$$uid),
      (edge) => edge.sort
    );
    callback(node, childEdges);
    for (const edge of childEdges) {
      walk(edge.child, callback);
    }
  };

  walk(rootId, (node, childEdges) => {
    if (!node.$$isExpandableTemplate) {
      return;
    }
    for (const childEdge of childEdges) {
      // Recursively expand templates.
      let cursorNode = node;
      let cursorMountPoint = childEdge.mountPoint;
      // eslint-disable-next-line no-constant-condition
      while (true) {
        let proxySlotConf: CustomTemplateProxySlot;
        let delegateToParentUid: number;
        if (
          cursorNode.$$isExpandableTemplate &&
          cursorNode.$$templateProxy?.slots &&
          hasOwnProperty(cursorNode.$$templateProxy.slots, cursorMountPoint) &&
          (proxySlotConf =
            cursorNode.$$templateProxy.slots[cursorMountPoint]) &&
          (delegateToParentUid = cursorNode.$$templateRefToUid.get(
            proxySlotConf.ref
          ))
        ) {
          cursorNode = nodes.find((n) => n.$$uid === delegateToParentUid);
          cursorMountPoint = proxySlotConf.refSlot;
          if (!cursorNode.$$isExpandableTemplate) {
            const expandedEdge: BuilderRuntimeEdge = {
              child: childEdge.child,
              parent: delegateToParentUid,
              mountPoint: cursorMountPoint,
              sort: undefined,
              $$isTemplateExpanded: true,
            };
            const siblingEdges = sortBy(
              newEdges.filter((edge) => edge.parent === delegateToParentUid),
              (edge) => reorderedEdgesMap.get(edge) ?? edge.sort
            );
            const internalEdges = siblingEdges.filter(
              (edge) => edge.$$isTemplateInternal
            );
            // For more details about refPosition implementation detail,
            // see `packages/brick-kit/src/core/CustomTemplates/expandCustomTemplate.ts`.
            const refPosition = proxySlotConf.refPosition ?? -1;
            const clampedRefPosition = clamp(
              refPosition < 0
                ? internalEdges.length + 1 + refPosition
                : refPosition,
              0,
              internalEdges.length
            );
            siblingEdges.splice(
              clampedRefPosition < internalEdges.length
                ? siblingEdges.findIndex(
                    (edge) => edge === internalEdges[clampedRefPosition]
                  )
                : siblingEdges.length,
              0,
              expandedEdge
            );
            siblingEdges.forEach((edge, index) => {
              reorderedEdgesMap.set(edge, index);
            });
            newEdges.push(expandedEdge);
            break;
          }
        } else {
          break;
        }
      }
    }
  });

  if (newEdges.length > edges.length) {
    return newEdges.map((edge) => {
      const sort = reorderedEdgesMap.get(edge);
      return sort === undefined
        ? edge
        : {
            ...edge,
            sort,
          };
    });
  }

  return edges;
}
