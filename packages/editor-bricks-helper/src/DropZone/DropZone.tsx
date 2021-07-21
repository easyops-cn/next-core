/* istanbul-ignore-file */
// Todo(steve): Ignore tests temporarily for potential breaking change in the future.
import React from "react";
import { clamp } from "lodash";
import classNames from "classnames";
import { DragObjectWithType, useDrop } from "react-dnd";
import { EditorBrickAsComponent } from "../EditorBrickAsComponent/EditorBrickAsComponent";
import {
  BuilderCanvasSettings,
  BuilderDataTransferPayloadOfNodeToAdd,
  BuilderDataTransferPayloadOfNodeToMove,
  BuilderDataTransferType,
  BuilderGroupedChildNode,
  BuilderRuntimeNode,
  EditorSlotContentLayout,
  TemplateDelegatedContext,
} from "../interfaces";
import { useBuilderNode } from "../hooks/useBuilderNode";
import {
  getBuilderGroupedChildNodes,
  useBuilderGroupedChildNodes,
} from "../hooks/useBuilderGroupedChildNodes";
import { useCanDrop } from "../hooks/useCanDrop";
import { DropPositionCursor, getDropPosition } from "./getDropPosition";
import { processDrop } from "./processDrop";
import { useBuilderDataManager } from "../hooks/useBuilderDataManager";
import { useCanvasList } from "../hooks/useCanvasList";
import { useBuilderData } from "../hooks/useBuilderData";
import { useBuilderContextMenuStatus } from "../hooks/useBuilderContextMenuStatus";
import { isCurrentTargetByClassName } from "../EditorContainer/isCurrentTargetByClassName";

import styles from "./DropZone.module.css";

export interface DropZoneProps {
  nodeUid?: number;
  isRoot?: boolean;
  separateCanvas?: boolean;
  isPortalCanvas?: boolean;
  independentPortalCanvas?: boolean;
  canvasIndex?: number;
  mountPoint: string;
  fullscreen?: boolean;
  delegatedContext?: TemplateDelegatedContext;
  dropZoneStyle?: React.CSSProperties;
  dropZoneBodyStyle?: React.CSSProperties;
  slotContentLayout?: EditorSlotContentLayout;
  showOutlineIfEmpty?: boolean;
}

export interface DroppingContext {
  droppingParentUid: number;
  droppingParentInstanceId: string;
  droppingMountPoint: string;
  droppingChildNodes: BuilderRuntimeNode[];
  droppingSiblingGroups: BuilderGroupedChildNode[];
}

export function DropZone({
  nodeUid,
  isRoot,
  separateCanvas,
  isPortalCanvas,
  independentPortalCanvas,
  canvasIndex,
  mountPoint,
  fullscreen,
  delegatedContext,
  dropZoneStyle,
  dropZoneBodyStyle,
  slotContentLayout,
  showOutlineIfEmpty,
}: DropZoneProps): React.ReactElement {
  const dropZoneBody = React.useRef<HTMLDivElement>();
  const [dropPositionCursor, setDropPositionCursor] =
    React.useState<DropPositionCursor>(null);
  const dropPositionCursorRef = React.useRef<DropPositionCursor>();
  const contextMenuStatus = useBuilderContextMenuStatus();
  const manager = useBuilderDataManager();
  const node = useBuilderNode({ nodeUid, isRoot });
  const groupedChildNodes = useBuilderGroupedChildNodes({
    nodeUid,
    isRoot,
  });

  const isGeneralizedPortalCanvas = independentPortalCanvas
    ? canvasIndex > 0
    : isPortalCanvas;
  const hasTabs = separateCanvas || independentPortalCanvas;

  const canDrop = useCanDrop();
  const refinedSlotContentLayout =
    slotContentLayout ?? EditorSlotContentLayout.BLOCK;

  const selfChildNodes = React.useMemo(
    () =>
      groupedChildNodes.find((group) => group.mountPoint === mountPoint)
        ?.childNodes ?? [],
    [groupedChildNodes, mountPoint]
  );

  const canvasList = useCanvasList(selfChildNodes);

  const selfChildNodesInCurrentCanvas = React.useMemo(
    () =>
      separateCanvas
        ? selfChildNodes.filter((child) =>
            Boolean(Number(Boolean(isPortalCanvas)) ^ Number(!child.portal))
          )
        : independentPortalCanvas
        ? canvasList[clamp(canvasIndex ?? 0, 0, canvasList.length - 1)]
        : selfChildNodes,
    [
      canvasIndex,
      independentPortalCanvas,
      isPortalCanvas,
      selfChildNodes,
      canvasList,
      separateCanvas,
    ]
  );

  const canvasSettings = React.useMemo(
    () =>
      selfChildNodesInCurrentCanvas[0]?.$$parsedProperties
        ._canvas_ as BuilderCanvasSettings,
    [selfChildNodesInCurrentCanvas]
  );

  const getDroppingIndexInFullCanvas = React.useCallback(
    (droppingIndexInCurrentCanvas: number) => {
      if (!hasTabs) {
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
      return isGeneralizedPortalCanvas ? selfChildNodes.length : 0;
    },
    [
      hasTabs,
      selfChildNodesInCurrentCanvas,
      isGeneralizedPortalCanvas,
      selfChildNodes,
    ]
  );

  const { nodes, edges } = useBuilderData();

  const getDroppingContext = React.useCallback(() => {
    if (delegatedContext) {
      const siblingGroups = getBuilderGroupedChildNodes({
        nodeUid: delegatedContext.templateUid,
        nodes,
        edges,
        doNotExpandTemplates: true,
      });
      return {
        droppingParentUid: delegatedContext.templateUid,
        droppingParentInstanceId: nodes.find(
          (item) => item.$$uid === delegatedContext.templateUid
        ).instanceId,
        droppingMountPoint: delegatedContext.templateMountPoint,
        droppingChildNodes:
          siblingGroups.find(
            (group) => group.mountPoint === delegatedContext.templateMountPoint
          )?.childNodes ?? [],
        droppingSiblingGroups: siblingGroups,
      };
    }
    return {
      droppingParentUid: node.$$uid,
      droppingParentInstanceId: node.instanceId,
      droppingMountPoint: mountPoint,
      droppingChildNodes: selfChildNodes,
      droppingSiblingGroups: groupedChildNodes,
    };
  }, [
    delegatedContext,
    edges,
    groupedChildNodes,
    mountPoint,
    node,
    nodes,
    selfChildNodes,
  ]);

  const [{ isDraggingOverCurrent }, dropRef] = useDrop({
    accept: [
      BuilderDataTransferType.NODE_TO_ADD,
      BuilderDataTransferType.NODE_TO_MOVE,
      BuilderDataTransferType.SNIPPET_TO_APPLY,
    ],
    canDrop: (
      item: DragObjectWithType &
        (
          | BuilderDataTransferPayloadOfNodeToAdd
          | BuilderDataTransferPayloadOfNodeToMove
        )
    ) =>
      independentPortalCanvas && isGeneralizedPortalCanvas
        ? selfChildNodesInCurrentCanvas.length === 0
        : item.type === BuilderDataTransferType.NODE_TO_ADD ||
          item.type === BuilderDataTransferType.SNIPPET_TO_APPLY ||
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
          isPortalCanvas: isGeneralizedPortalCanvas,
          manager,
          ...getDroppingContext(),
        });
      }
    },
  });

  React.useEffect(() => {
    manager.updateDroppingStatus(
      delegatedContext ? delegatedContext.templateUid : node.$$uid,
      delegatedContext ? delegatedContext.templateMountPoint : mountPoint,
      isDraggingOverCurrent
    );
  }, [isDraggingOverCurrent, mountPoint, manager, delegatedContext, node]);

  const droppable =
    !!delegatedContext ||
    !(node.$$isExpandableTemplate || node.$$isTemplateInternalNode);

  const dropZoneRef = React.useRef<HTMLElement>();

  const dropZoneRefCallback = React.useCallback(
    (element: HTMLElement) => {
      dropZoneRef.current = element;
      if (droppable) {
        dropRef(element);
      }
    },
    [dropRef, droppable]
  );

  const handleContextMenu = React.useCallback(
    (event: React.MouseEvent) => {
      // `event.stopPropagation()` not working across bricks.
      if (
        !isGeneralizedPortalCanvas &&
        isCurrentTargetByClassName(
          event.target as HTMLElement,
          dropZoneRef.current
        )
      ) {
        event.preventDefault();
        manager.contextMenuChange({
          active: true,
          node,
          x: event.clientX,
          y: event.clientY,
        });
      }
    },
    [isGeneralizedPortalCanvas, manager, node]
  );

  return (
    <div
      ref={dropZoneRefCallback}
      className={classNames(
        styles.dropZone,
        isRoot
          ? classNames(
              styles.isRoot,
              canvasSettings?.mode &&
                String(canvasSettings.mode)
                  .split(/\s+/g)
                  .map((mode) => styles[`mode-${mode}`]),
              {
                [styles.fullscreen]: fullscreen,
                [styles.hasTabs]: hasTabs,
              }
            )
          : styles.isSlot,
        {
          [styles.isPortalCanvas]: isGeneralizedPortalCanvas,
          [styles.dropping]: isDraggingOverCurrent,
          [styles.active]:
            isRoot &&
            contextMenuStatus.active &&
            contextMenuStatus.node.$$uid === node.$$uid,
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
      onContextMenu={isRoot ? handleContextMenu : null}
    >
      <div
        ref={dropZoneBody}
        className={styles.dropZoneBody}
        style={dropZoneBodyStyle}
      >
        {selfChildNodesInCurrentCanvas.map((child) => (
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
