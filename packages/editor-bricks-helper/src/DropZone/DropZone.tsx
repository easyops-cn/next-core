/* istanbul-ignore-file */
// Todo(steve): Ignore tests temporarily for potential breaking change in the future.
import React from "react";
import { isEqual } from "lodash";
import classNames from "classnames";
import { EditorBrickAsComponent } from "../EditorBrickAsComponent/EditorBrickAsComponent";
import {
  BuilderDataTransferType,
  BuilderEventType,
  EditorSlotContentLayout,
  EventDetailOfNodeAdd,
  EventDetailOfNodeMove,
  EventDetailOfNodeReorder,
} from "../interfaces";
import {
  getDataOfDataTransfer,
  getTypeOfDataTransfer,
} from "../DataTransferHelper";
import { useDroppingStatusContext } from "../DroppingStatusContext";
import { getUniqueNodeId } from "../internal/getUniqueNodeId";
import { useBuilderNode } from "../hooks/useBuilderNode";
import { useBuilderChildNodes } from "../hooks/useBuilderChildNodes";
import { DropPositionCursor, getDropPosition } from "./getDropPosition";

import styles from "./DropZone.module.css";
import { useCurrentDraggingFamily } from "../hooks/useCurrentDraggingFamily";

export interface DropZoneProps {
  nodeUid?: number;
  isRoot?: boolean;
  mountPoint: string;
  dropZoneStyle?: React.CSSProperties;
  slotContentLayout?: EditorSlotContentLayout;
  showOutlineIfEmpty?: boolean;
}

export function DropZone({
  nodeUid,
  isRoot,
  mountPoint,
  dropZoneStyle,
  slotContentLayout,
  showOutlineIfEmpty,
}: DropZoneProps): React.ReactElement {
  const {
    dropping,
    droppingMountPoint,
    setDropping,
    setDroppingMountPoint,
  } = useDroppingStatusContext();
  const dropZone = React.useRef<HTMLDivElement>();
  const dropZoneGrid = React.useRef<HTMLDivElement>();
  const [
    dropPositionCursor,
    setDropPositionCursor,
  ] = React.useState<DropPositionCursor>(null);
  const dropPositionCursorRef = React.useRef<DropPositionCursor>();
  const node = useBuilderNode({ nodeUid, isRoot });
  const childNodes = useBuilderChildNodes({
    nodeUid,
    isRoot,
    mountPoint,
  });
  const draggingFamily = useCurrentDraggingFamily();

  const isActiveDropZone = React.useCallback(
    (target: EventTarget) => {
      // Users cannot drag a node into its internal mount points,
      // which would result in a nested tree.
      if (draggingFamily.includes(node.$$uid)) {
        return false;
      }
      let element = target as HTMLElement;
      while (element) {
        if (element === dropZone.current) {
          return true;
        }
        if (element.classList.contains(styles.dropZone)) {
          return false;
        }
        element = element.parentElement;
      }
    },
    [draggingFamily, node]
  );

  const handleDragOver = React.useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      if (!isActiveDropZone(event.target)) {
        return;
      }
      const type = getTypeOfDataTransfer(event.dataTransfer);
      if (!type) {
        return;
      }
      event.dataTransfer.dropEffect =
        type === BuilderDataTransferType.NODE_TO_ADD ? "copy" : "move";
      event.preventDefault();
      setDropping?.(true);
      setDroppingMountPoint?.(mountPoint);
      dropPositionCursorRef.current = getDropPosition(
        event,
        dropZone.current,
        dropZoneGrid.current
      );
      setDropPositionCursor(dropPositionCursorRef.current);
    },
    [isActiveDropZone, mountPoint, setDropping, setDroppingMountPoint]
  );

  // React.useEffect(() => {
  //   if (dropZone.current && dropZoneGrid.current && node) {
  //     setTimeout(() => {
  //       const positions = getDropPositions(dropZone.current, dropZoneGrid.current);
  //       console.log(node.brick, positions);
  //     }, 2e3);
  //   }
  // }, [node?.brick]);

  const handleDragLeave = React.useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      if (isActiveDropZone(event.target)) {
        event.preventDefault();
        setDropping?.(false);
      }
    },
    [isActiveDropZone, setDropping]
  );

  const handleDrop = React.useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDropping?.(false);
      if (!isActiveDropZone(event.target)) {
        return;
      }
      const type = getTypeOfDataTransfer(event.dataTransfer);
      if (!type) {
        return;
      }
      const dropIndex = dropPositionCursorRef.current.index;
      if (type === BuilderDataTransferType.NODE_TO_ADD) {
        const brick = getDataOfDataTransfer(event.dataTransfer, type).brick;
        const nodeUid = getUniqueNodeId();
        const nodeUids = childNodes.map((item) => item.$$uid);
        nodeUids.splice(dropIndex, 0, nodeUid);
        const nodeIds = childNodes.map((item) => item.id);
        nodeIds.splice(dropIndex, 0, null);
        window.dispatchEvent(
          new CustomEvent<EventDetailOfNodeAdd>(BuilderEventType.NODE_ADD, {
            detail: {
              nodeUid,
              parentUid: node.$$uid,
              nodeUids,
              nodeIds,
              nodeAlias: brick.split(".").pop(),
              nodeData: {
                parent: node.instanceId,
                type: "brick",
                brick,
                mountPoint,
              },
            },
          })
        );
      } else if (type === BuilderDataTransferType.NODE_TO_MOVE) {
        const { nodeUid, nodeInstanceId, nodeId } = getDataOfDataTransfer(
          event.dataTransfer,
          type
        );

        const innerIndex = childNodes.findIndex(
          (item) => item.$$uid === nodeUid
        );
        if (innerIndex >= 0) {
          const originalOrder = childNodes.map((item) => item.$$uid);
          const newOrder = originalOrder.slice();
          newOrder.splice(dropIndex, 0, nodeUid);
          newOrder.splice(
            dropIndex <= innerIndex ? innerIndex + 1 : innerIndex,
            1
          );
          if (!isEqual(originalOrder, newOrder)) {
            window.dispatchEvent(
              new CustomEvent<EventDetailOfNodeReorder>(
                BuilderEventType.NODE_REORDER,
                {
                  detail: {
                    nodeUids: newOrder,
                    parentUid: node.$$uid,
                    mountPoint,
                    nodeIds: newOrder.map(
                      (uid) => childNodes.find((node) => node.$$uid === uid).id
                    ),
                  },
                }
              )
            );
          }
        } else {
          const nodeUids = childNodes.map((item) => item.$$uid);
          nodeUids.splice(dropIndex, 0, nodeUid);
          const nodeIds = childNodes.map((item) => item.id);
          nodeIds.splice(dropIndex, 0, nodeId);
          window.dispatchEvent(
            new CustomEvent<EventDetailOfNodeMove>(BuilderEventType.NODE_MOVE, {
              detail: {
                nodeUid,
                parentUid: node.$$uid,
                nodeUids,
                nodeIds,
                nodeInstanceId,
                nodeData: {
                  parent: node.instanceId,
                  mountPoint,
                },
              },
            })
          );
        }
      }
    },
    [isActiveDropZone, mountPoint, node, childNodes, setDropping]
  );

  return (
    <div
      ref={dropZone}
      className={classNames(
        styles.dropZone,
        isRoot ? styles.isRoot : styles.isSlot,
        {
          [styles.dropping]: dropping && droppingMountPoint === mountPoint,
          [styles.showOutlineIfEmpty]:
            !isRoot && showOutlineIfEmpty && childNodes.length === 0,
          [styles.slotContentLayoutBlock]:
            !slotContentLayout ||
            slotContentLayout === EditorSlotContentLayout.BLOCK,
          [styles.slotContentLayoutInline]:
            slotContentLayout === EditorSlotContentLayout.INLINE,
          [styles.slotContentLayoutGrid]:
            slotContentLayout === EditorSlotContentLayout.GRID,
        }
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      style={dropZoneStyle}
    >
      <div ref={dropZoneGrid} className={styles.dropZoneGrid}>
        {childNodes?.map((child) => (
          <EditorBrickAsComponent
            key={child.$$uid}
            node={child}
            slotContentLayout={slotContentLayout}
          />
        ))}
      </div>
      <div
        className={classNames(
          styles.dropCursor,
          dropPositionCursor?.isVertical
            ? styles.dropCursorVertical
            : styles.dropCursorHorizontal
        )}
        style={{
          top: dropPositionCursor?.y,
          left: dropPositionCursor?.x,
          height: dropPositionCursor?.height,
        }}
      ></div>
    </div>
  );
}
