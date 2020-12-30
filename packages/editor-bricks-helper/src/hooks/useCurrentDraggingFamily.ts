import { useCallback, useEffect, useMemo, useState } from "react";
import { BuilderEventType, EventDetailOfNodeDragStart } from "../interfaces";
import { useBuilderData } from "./useBuilderData";

/**
 * Returns the current dragging family (the current dragging node
 * and all its descendants).
 *
 * This is useful for checking available drop zone and preventing
 * dragging a node into its internal mount points.
 */
export function useCurrentDraggingFamily(): number[] {
  const [draggingNodeUid, setDraggingNodeUid] = useState<number>();
  const { edges } = useBuilderData();

  const onNodeDragStart = useCallback(
    (event: CustomEvent<EventDetailOfNodeDragStart>) => {
      setDraggingNodeUid(event.detail.nodeUid);
    },
    []
  ) as EventListener;

  useEffect(() => {
    window.addEventListener(BuilderEventType.NODE_DRAG_START, onNodeDragStart);
    return () =>
      window.removeEventListener(
        BuilderEventType.NODE_DRAG_START,
        onNodeDragStart
      );
  }, [onNodeDragStart]);

  return useMemo(() => {
    const ids: number[] = [];
    const traverse = (parentId: number): void => {
      ids.push(parentId);
      edges.forEach((edge) => {
        if (edge.parent === parentId) {
          traverse(edge.child);
        }
      });
    };
    if (draggingNodeUid) {
      traverse(draggingNodeUid);
    }
    return ids;
  }, [edges, draggingNodeUid]);
}
