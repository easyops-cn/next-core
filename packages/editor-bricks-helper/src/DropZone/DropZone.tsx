/* istanbul-ignore-file */
// Todo(steve): Ignore tests temporarily for potential breaking change in the future.
import React from "react";
import classNames from "classnames";
import { EditorBrickAsComponent } from "../EditorBrickAsComponent/EditorBrickAsComponent";
import {
  BuilderDataTransferType,
  EditorSlotContentLayout,
} from "../interfaces";
import {
  getDataOfDataTransfer,
  getTypeOfDataTransfer,
} from "../DataTransferHelper";
import { useDroppingStatusContext } from "../DroppingStatusContext";
import { useBuilderNode } from "../hooks/useBuilderNode";
import { useBuilderGroupedChildNodes } from "../hooks/useBuilderGroupedChildNodes";
import { DropPositionCursor, getDropPosition } from "./getDropPosition";
import { useCurrentDraggingFamily } from "../hooks/useCurrentDraggingFamily";
import { processDrop } from "./processDrop";

import styles from "./DropZone.module.css";

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
  const groupedChildNodes = useBuilderGroupedChildNodes({
    nodeUid,
    isRoot,
  });
  const draggingFamily = useCurrentDraggingFamily();

  const selfChildNodes = React.useMemo(
    () =>
      groupedChildNodes.find((group) => group.mountPoint === mountPoint)
        ?.childNodes ?? [],
    [groupedChildNodes, mountPoint]
  );

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
      processDrop({
        type,
        data: getDataOfDataTransfer(
          event.dataTransfer,
          type as BuilderDataTransferType.NODE_TO_ADD
        ),
        dropIndex: dropPositionCursorRef.current.index,
        parentUid: node.$$uid,
        parentInstanceId: node.instanceId,
        mountPoint,
        selfChildNodes,
        groupedChildNodes,
      });
    },
    [
      isActiveDropZone,
      mountPoint,
      node,
      groupedChildNodes,
      selfChildNodes,
      setDropping,
    ]
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
            !isRoot && showOutlineIfEmpty && selfChildNodes.length === 0,
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
        {selfChildNodes?.map((child) => (
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
