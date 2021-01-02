import { useCallback } from "react";
import { useBuilderData } from "./useBuilderData";

export type CanDrop = (draggingUid: number, nodeUid: number) => boolean;

/**
 * Returns whether the current dragging node can be dropped
 * in specific node.
 *
 * This is useful for checking available drop zone and preventing
 * dragging a node into its internal mount points.
 */

export function useCanDrop(): CanDrop {
  const { edges } = useBuilderData();
  return useCallback(
    (draggingUid: number, nodeUid: number) => {
      const traverse = (parentId: number): boolean => {
        if (parentId === nodeUid) {
          return false;
        }
        return !edges.some((edge) => {
          if (edge.parent === parentId) {
            return !traverse(edge.child);
          }
          return false;
        });
      };
      return traverse(draggingUid);
    },
    [edges]
  );
}
