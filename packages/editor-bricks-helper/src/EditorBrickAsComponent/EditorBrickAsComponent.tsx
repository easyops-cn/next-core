import React from "react";
import classNames from "classnames";
import { BrickAsComponent } from "@easyops/brick-kit";
import { BuilderBrickNode, UseBrickConf } from "@easyops/brick-types";
import { getEditorBrick } from "./getEditorBrick";
import {
  BuilderDataTransferType,
  BuilderEventType,
  BuilderRuntimeNode,
  EditorSelfLayout,
  EditorSlotContentLayout,
  EventDetailOfNodeDragStart,
} from "../interfaces";
import { setDataOfDataTransfer } from "../DataTransferHelper";
import { EditorBrickElementConstructor } from "../EditorElementFactory";

import styles from "./EditorBrickAsComponent.module.css";

interface EditorBrickAsComponentProps {
  node: BuilderRuntimeNode;
  slotContentLayout?: EditorSlotContentLayout;
}

export function EditorBrickAsComponent({
  node,
  slotContentLayout,
}: EditorBrickAsComponentProps): React.ReactElement {
  const [initialized, setInitialized] = React.useState(false);
  const [editorBrick, setEditorBrick] = React.useState<string>();
  const [dragging, setDragging] = React.useState(false);
  const dragZone = React.useRef<HTMLDivElement>();

  React.useEffect(() => {
    (async () => {
      setInitialized(false);
      setEditorBrick(await getEditorBrick((node as BuilderBrickNode).brick));
      setInitialized(true);
    })();
  }, [(node as BuilderBrickNode).brick]);

  const brickConf = React.useMemo<UseBrickConf>(
    () => ({
      brick: editorBrick,
      properties: {
        nodeUid: node.$$uid,
        brick: node.brick,
      },
    }),
    [editorBrick, node.$$uid, node.brick]
  );

  const selfLayout = React.useMemo(() => {
    let layout: EditorSelfLayout;
    if (initialized && editorBrick) {
      const editorConstructor = customElements.get(
        editorBrick
      ) as EditorBrickElementConstructor;
      layout = editorConstructor.selfLayout;
    }
    return layout ?? EditorSelfLayout.INLINE;
  }, [initialized, editorBrick]);

  const handleDragStart = React.useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      if (event.target === dragZone.current) {
        setDragging(true);
        setDataOfDataTransfer(
          event.dataTransfer,
          BuilderDataTransferType.NODE_TO_MOVE,
          {
            nodeUid: node.$$uid,
            nodeInstanceId: node.instanceId,
            nodeId: node.id,
          }
        );
        (event as any).effectAllowed = "move";
        window.dispatchEvent(
          new CustomEvent<EventDetailOfNodeDragStart>(
            BuilderEventType.NODE_DRAG_START,
            {
              detail: {
                nodeUid: node.$$uid,
              },
            }
          )
        );
      }
    },
    [node]
  );

  const handleDragEnd = React.useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      if (event.target === dragZone.current) {
        setDragging(false);
        event.dataTransfer.clearData();
      }
    },
    []
  );

  return initialized ? (
    editorBrick ? (
      <div
        className={classNames({
          [styles.slotContentLayoutBlock]:
            !slotContentLayout ||
            slotContentLayout === EditorSlotContentLayout.BLOCK,
          [styles.slotContentLayoutInline]:
            slotContentLayout === EditorSlotContentLayout.INLINE,
          // [styles.slotContentLayoutGrid]: slotContentLayout === EditorSlotContentLayout.GRID,
          [styles.selfLayoutInline]: selfLayout === EditorSelfLayout.INLINE,
          [styles.selfLayoutBlock]: selfLayout === EditorSelfLayout.BLOCK,
          [styles.selfLayoutContainer]:
            selfLayout === EditorSelfLayout.CONTAINER,
          [styles.dragging]: dragging,
        })}
      >
        <div
          ref={dragZone}
          draggable
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          className={classNames({
            [styles.microView]:
              node.brick === "basic-bricks.micro-view" ||
              node.brick === "basic-bricks.micro-app",
          })}
        >
          <BrickAsComponent useBrick={brickConf} />
        </div>
      </div>
    ) : (
      <span>{`Load editor failed for "${node.brick}"`}</span>
    )
  ) : (
    <span>Loading...</span>
  );
}
