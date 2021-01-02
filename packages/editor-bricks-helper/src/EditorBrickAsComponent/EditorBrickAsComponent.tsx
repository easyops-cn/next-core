import React from "react";
import classNames from "classnames";
import { useDrag } from "react-dnd";
import { BrickAsComponent } from "@easyops/brick-kit";
import { BuilderBrickNode, UseBrickConf } from "@easyops/brick-types";
import { getEditorBrick } from "./getEditorBrick";
import {
  BuilderDataTransferType,
  BuilderRuntimeNode,
  EditorSelfLayout,
  EditorSlotContentLayout,
} from "../interfaces";
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

  const [{ isDragging }, dragRef] = useDrag({
    item: {
      type: BuilderDataTransferType.NODE_TO_MOVE,
      nodeUid: node.$$uid,
      nodeInstanceId: node.instanceId,
      nodeId: node.id,
    },
    options: {
      dropEffect: "move",
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

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
          [styles.dragging]: isDragging,
        })}
      >
        <div
          ref={dragRef}
          draggable
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
