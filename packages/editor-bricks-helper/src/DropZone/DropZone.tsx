/* istanbul-ignore-file */
// Todo(steve): Ignore tests temporarily for potential breaking change in the future.
import React from "react";
import classNames from "classnames";
import { DragObjectWithType, useDrop } from "react-dnd";
import { EditorBrickAsComponent } from "../EditorBrickAsComponent/EditorBrickAsComponent";
import {
  BuilderDataTransferPayloadOfNodeToAdd,
  BuilderDataTransferPayloadOfNodeToMove,
  BuilderDataTransferType,
  EditorSlotContentLayout,
} from "../interfaces";
import { useDroppingStatusContext } from "../DroppingStatusContext";
import { useBuilderNode } from "../hooks/useBuilderNode";
import { useBuilderGroupedChildNodes } from "../hooks/useBuilderGroupedChildNodes";
import { useCanDrop } from "../hooks/useCanDrop";
import { DropPositionCursor, getDropPosition } from "./getDropPosition";
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
  const { setDroppingStatus } = useDroppingStatusContext();
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
  const canDrop = useCanDrop();

  const selfChildNodes = React.useMemo(
    () =>
      groupedChildNodes.find((group) => group.mountPoint === mountPoint)
        ?.childNodes ?? [],
    [groupedChildNodes, mountPoint]
  );

  const [{ isDraggingOverCurrent }, dropRef] = useDrop({
    accept: [
      BuilderDataTransferType.NODE_TO_ADD,
      BuilderDataTransferType.NODE_TO_MOVE,
    ],
    canDrop: (
      item: DragObjectWithType &
        (
          | BuilderDataTransferPayloadOfNodeToAdd
          | BuilderDataTransferPayloadOfNodeToMove
        )
    ) =>
      item.type === BuilderDataTransferType.NODE_TO_ADD ||
      isRoot ||
      canDrop(
        (item as BuilderDataTransferPayloadOfNodeToMove).nodeUid,
        nodeUid
      ),
    collect: (monitor) => ({
      isDraggingOverCurrent:
        monitor.isOver({ shallow: true }) && monitor.canDrop(),
    }),
    hover: (item, monitor) => {
      if (monitor.isOver({ shallow: true }) && monitor.canDrop()) {
        const { x, y } = monitor.getClientOffset();
        dropPositionCursorRef.current = getDropPosition(
          x,
          y,
          dropZoneGrid.current.parentElement,
          dropZoneGrid.current
        );
        setDropPositionCursor(dropPositionCursorRef.current);
      }
    },
    drop: (item, monitor) => {
      if (!monitor.didDrop()) {
        const { type, ...data } = item;
        processDrop({
          type: type as BuilderDataTransferType,
          data,
          dropIndex: dropPositionCursorRef.current.index,
          parentUid: node.$$uid,
          parentInstanceId: node.instanceId,
          mountPoint,
          selfChildNodes,
          groupedChildNodes,
        });
      }
    },
  });

  React.useEffect(() => {
    setDroppingStatus((prev) => ({
      ...prev,
      [mountPoint]: isDraggingOverCurrent,
    }));
  }, [isDraggingOverCurrent, mountPoint, setDroppingStatus]);

  return (
    <div
      ref={dropRef}
      className={classNames(
        styles.dropZone,
        isRoot ? styles.isRoot : styles.isSlot,
        {
          [styles.dropping]: isDraggingOverCurrent,
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
      {
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
      }
    </div>
  );
}
