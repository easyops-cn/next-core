/* istanbul-ignore-file */
// Todo(steve): Ignore tests temporarily for potential breaking change in the future.
import React, { useEffect } from "react";
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
import { useBuilderDataManager } from "../hooks/useBuilderDataManager";
import { useBuilderData } from "../hooks/useBuilderData";
import { getRelatedNodesBasedOnEvents } from "../processors/getRelatedNodesBasedOnEvents";

import styles from "./DropZone.module.css";

export interface DropZoneProps {
  nodeUid?: number;
  isRoot?: boolean;
  separateCanvas?: boolean;
  isPortalCanvas?: boolean;
  mountPoint: string;
  fullscreen?: boolean;
  dropZoneStyle?: React.CSSProperties;
  dropZoneBodyStyle?: React.CSSProperties;
  slotContentLayout?: EditorSlotContentLayout;
  showOutlineIfEmpty?: boolean;
}

export function DropZone({
  nodeUid,
  isRoot,
  separateCanvas,
  isPortalCanvas,
  mountPoint,
  fullscreen,
  dropZoneStyle,
  dropZoneBodyStyle,
  slotContentLayout,
  showOutlineIfEmpty,
}: DropZoneProps): React.ReactElement {
  const { setDroppingStatus } = useDroppingStatusContext();
  const dropZoneBody = React.useRef<HTMLDivElement>();
  const [
    dropPositionCursor,
    setDropPositionCursor,
  ] = React.useState<DropPositionCursor>(null);
  const dropPositionCursorRef = React.useRef<DropPositionCursor>();
  const manager = useBuilderDataManager();
  const node = useBuilderNode({ nodeUid, isRoot });
  const groupedChildNodes = useBuilderGroupedChildNodes({
    nodeUid,
    isRoot,
  });
  const { nodes } = useBuilderData();

  useEffect(() => {
    if (isRoot) {
      const rootNodeIsCustomTemplate = node.type === "custom-template";
      const relatedNodesBasedOnEvents = getRelatedNodesBasedOnEvents(
        nodes,
        rootNodeIsCustomTemplate
      );
      manager.setRelatedNodesBasedOnEventsMap(relatedNodesBasedOnEvents);
    }
  }, [isRoot, nodes]);

  const canDrop = useCanDrop();
  const refinedSlotContentLayout =
    slotContentLayout ?? EditorSlotContentLayout.BLOCK;

  const selfChildNodes = React.useMemo(
    () =>
      groupedChildNodes.find((group) => group.mountPoint === mountPoint)
        ?.childNodes ?? [],
    [groupedChildNodes, mountPoint]
  );

  const selfChildNodesInCurrentCanvas = React.useMemo(
    () =>
      isRoot && separateCanvas
        ? selfChildNodes.filter((child) =>
            Boolean(Number(Boolean(isPortalCanvas)) ^ Number(!child.portal))
          )
        : selfChildNodes,
    [isPortalCanvas, isRoot, selfChildNodes, separateCanvas]
  );

  const getDroppingIndexInFullCanvas = React.useCallback(
    (droppingIndexInCurrentCanvas: number) => {
      if (!separateCanvas) {
        return droppingIndexInCurrentCanvas;
      }
      if (selfChildNodesInCurrentCanvas.length > 0) {
        const cursorNode =
          selfChildNodesInCurrentCanvas[
            droppingIndexInCurrentCanvas === 0
              ? 0
              : droppingIndexInCurrentCanvas - 1
          ];
        return (
          selfChildNodes.findIndex((child) => child === cursorNode) +
          (droppingIndexInCurrentCanvas === 0 ? 0 : 1)
        );
      }
      return isPortalCanvas
        ? selfChildNodes.length - selfChildNodesInCurrentCanvas.length
        : 0;
    },
    [
      separateCanvas,
      selfChildNodesInCurrentCanvas,
      isPortalCanvas,
      selfChildNodes,
    ]
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
          dropZoneBody.current.parentElement,
          dropZoneBody.current
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
          droppingIndex: getDroppingIndexInFullCanvas(
            dropPositionCursorRef.current.index
          ),
          droppingParentUid: node.$$uid,
          droppingParentInstanceId: node.instanceId,
          droppingMountPoint: mountPoint,
          droppingChildNodes: selfChildNodes,
          droppingSiblingGroups: groupedChildNodes,
          isPortalCanvas,
          manager,
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
        isRoot
          ? classNames(styles.isRoot, {
              [styles.fullscreen]: fullscreen,
              [styles.hasTabs]: separateCanvas,
            })
          : styles.isSlot,
        {
          [styles.isPortalCanvas]: isPortalCanvas,
          [styles.dropping]: isDraggingOverCurrent,
          [styles.showOutlineIfEmpty]:
            !isRoot && showOutlineIfEmpty && selfChildNodes.length === 0,
          [styles.slotContentLayoutBlock]:
            refinedSlotContentLayout === EditorSlotContentLayout.BLOCK,
          [styles.slotContentLayoutInline]:
            refinedSlotContentLayout === EditorSlotContentLayout.INLINE,
          [styles.slotContentLayoutGrid]:
            refinedSlotContentLayout === EditorSlotContentLayout.GRID,
        }
      )}
      style={dropZoneStyle}
    >
      <div
        ref={dropZoneBody}
        className={styles.dropZoneBody}
        style={dropZoneBodyStyle}
      >
        {selfChildNodesInCurrentCanvas?.map((child) => (
          <EditorBrickAsComponent
            key={child.$$uid}
            node={child}
            slotContentLayout={refinedSlotContentLayout}
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
