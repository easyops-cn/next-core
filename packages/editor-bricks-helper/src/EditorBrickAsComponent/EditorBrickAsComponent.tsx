import React, { useMemo } from "react";
import classNames from "classnames";
import { useDrag } from "react-dnd";
import { BrickAsComponent, getRuntime } from "@next-core/brick-kit";
import { UseBrickConf } from "@next-core/brick-types";
import { getEditorBrick } from "./getEditorBrick";
import {
  BuilderDataTransferType,
  BuilderRuntimeNode,
  EditorSelfLayout,
  EditorSlotContentLayout,
} from "../interfaces";
import { EditorBrickElementConstructor } from "../EditorElementFactory";
import { useBuilderData } from "../hooks/useBuilderData";
import { useStoryList } from "../hooks/useStoryList";
import { getBrickDoc } from "./getBrickDoc";
import { useSharedEditorMap } from "../hooks/useSharedEditorMap";
import { isBrickNode } from "../assertions";

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
  const [loadEditorError, setLoadEditorError] = React.useState<string>();
  const { edges } = useBuilderData();
  const storyList = useStoryList();
  const hasChildren = React.useMemo(
    () => edges.some((edge) => edge.parent === node.$$uid),
    [node, edges]
  );

  const installedBricksEnabled = useMemo(
    () => getRuntime().getFeatureFlags()["next-builder-installed-bricks"],
    []
  );

  const brickDoc = useMemo(
    () => (installedBricksEnabled ? null : getBrickDoc(node, storyList)),
    [installedBricksEnabled, node, storyList]
  );

  const editorMap = useSharedEditorMap();
  const editorConf = useMemo(
    () =>
      installedBricksEnabled && isBrickNode(node)
        ? editorMap.get(node.brick)
        : null,
    [editorMap, installedBricksEnabled, node]
  );

  React.useEffect(() => {
    (async () => {
      setInitialized(false);
      let editorName: string;
      let editorError: string;
      try {
        editorName = await getEditorBrick(
          node,
          installedBricksEnabled ? editorConf?.editor : brickDoc?.editor
        );
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error);
        editorError = (error as Error).message;
      }
      setEditorBrick(editorName);
      setLoadEditorError(editorError);
      setInitialized(true);
    })();
  }, [brickDoc, editorConf, installedBricksEnabled, node]);

  const brickConf = React.useMemo<UseBrickConf>(
    () => ({
      brick: editorBrick,
      properties: {
        nodeUid: node.$$uid,
        editorProps: installedBricksEnabled
          ? editorConf?.editorProps
          : brickDoc?.editorProps,
      },
    }),
    [brickDoc, editorBrick, editorConf, installedBricksEnabled, node.$$uid]
  );

  const selfLayout = React.useMemo(() => {
    let layout: EditorSelfLayout;
    if (initialized && editorBrick) {
      const editorConstructor = customElements.get(
        editorBrick
      ) as EditorBrickElementConstructor;
      layout = editorConstructor.selfLayout;
    }
    // For bricks with no editors, display as a container if it has children.
    return (
      layout ??
      (hasChildren ? EditorSelfLayout.CONTAINER : EditorSelfLayout.INLINE)
    );
  }, [initialized, editorBrick, hasChildren]);

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
            slotContentLayout === EditorSlotContentLayout.BLOCK,
          [styles.slotContentLayoutInline]:
            slotContentLayout === EditorSlotContentLayout.INLINE,
          // [styles.slotContentLayoutGrid]: slotContentLayout === EditorSlotContentLayout.GRID,
          [styles.selfLayoutInline]: selfLayout === EditorSelfLayout.INLINE,
          [styles.selfLayoutBlock]: selfLayout === EditorSelfLayout.BLOCK,
          [styles.selfLayoutContainer]:
            selfLayout === EditorSelfLayout.CONTAINER,
          [styles.dragging]: isDragging,
          __isTemplateInternalNode: node.$$isTemplateInternalNode,
        })}
      >
        <div
          ref={node.$$isTemplateInternalNode ? undefined : dragRef}
          draggable={!node.$$isTemplateInternalNode}
          className={classNames({
            [styles.baseView]:
              node.brick === "basic-bricks.micro-view" ||
              node.brick === "basic-bricks.micro-app" ||
              node.brick === "basic-bricks.easy-view",
          })}
        >
          <BrickAsComponent useBrick={brickConf} />
        </div>
      </div>
    ) : (
      <span>{loadEditorError}</span>
    )
  ) : (
    <span>Loading...</span>
  );
}
