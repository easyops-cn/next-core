/* istanbul-ignore-file */
// Todo(steve): Ignore tests temporarily for potential breaking change in the future.
import React, { useEffect } from "react";
import classNames from "classnames";
import { EditorBrickType } from "../interfaces";
import {
  DroppingStatusContext,
  DroppingStatus,
} from "../DroppingStatusContext";
import { useBuilderNode } from "../hooks/useBuilderNode";
import { useBuilderDataManager } from "../hooks/useBuilderDataManager";
import { useBuilderContextMenuStatus } from "../hooks/useBuilderContextMenuStatus";
import { useShowRelatedNodesBasedOnEvents } from "../hooks/useShowRelatedNodesBasedOnEvents";
import { isCurrentTargetByClassName } from "../processors/isCurrentTargetByClassName";
import { useHoverNodeUid } from "../hooks/useHoverNodeUid";
import { useHighlightNodes } from "../hooks/useHighlightNodes";

import styles from "./EditorContainer.module.css";

interface EditorContainerProps {
  nodeUid: number;
  type?: EditorBrickType;
  isTransparentContainer?: boolean;
  editorContainerStyle?: React.CSSProperties;
  editorBodyStyle?: React.CSSProperties;
}

export function EditorContainer({
  nodeUid,
  type,
  isTransparentContainer,
  editorContainerStyle,
  editorBodyStyle,
  children,
}: React.PropsWithChildren<EditorContainerProps>): React.ReactElement {
  const [droppingStatus, setDroppingStatus] = React.useState<DroppingStatus>(
    {}
  );
  const editorContainerRef = React.useRef<HTMLDivElement>();
  const highlightNodes = useHighlightNodes();
  const node = useBuilderNode({ nodeUid });
  const [hover, setHover] = React.useState(false);
  const [isUpstreamNode, setIsUpstreamNode] = React.useState(false);
  const [isDownstreamNode, setIsDownstreamNode] = React.useState(false);
  const contextMenuStatus = useBuilderContextMenuStatus();
  const hoverNodeUid = useHoverNodeUid();
  const showRelatedEvents = useShowRelatedNodesBasedOnEvents();
  const manager = useBuilderDataManager();
  const editorType = type ?? EditorBrickType.DEFAULT;

  const handleMouseEnter = React.useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      setHover(true);
      if (hoverNodeUid !== nodeUid) {
        manager.setHoverNodeUid(nodeUid);
      }
    },
    [hoverNodeUid, nodeUid, manager]
  );

  const handleMouseLeave = React.useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      setHover(false);
      if (hoverNodeUid === nodeUid) {
        manager.setHoverNodeUid(undefined);
      }
    },
    [hoverNodeUid, nodeUid, manager]
  );

  useEffect(() => {
    setHover(hoverNodeUid === nodeUid);
    if (showRelatedEvents) {
      const relatedNodes = manager.getRelatedNodesBasedOnEventsMap();
      const isUpstreamNode = relatedNodes
        .get(hoverNodeUid)
        ?.upstreamNodes.has(nodeUid);
      setIsUpstreamNode(isUpstreamNode);
      const isDownstreamNode = relatedNodes
        .get(hoverNodeUid)
        ?.downstreamNodes.has(nodeUid);
      setIsDownstreamNode(isDownstreamNode);
    }
  }, [hoverNodeUid, nodeUid, showRelatedEvents, manager]);

  const isCurrentTarget = React.useCallback(
    (event: React.MouseEvent) =>
      isCurrentTargetByClassName(
        event.target as HTMLElement,
        editorContainerRef.current,
        styles.editorContainer
      ),
    []
  );

  const handleClick = React.useCallback(
    (event: React.MouseEvent) => {
      // `event.stopPropagation()` not working across bricks.
      if (isCurrentTarget(event)) {
        manager.nodeClick(node);
      }
    },
    [isCurrentTarget, manager, node]
  );

  const handleContextMenu = React.useCallback(
    (event: React.MouseEvent) => {
      // `event.stopPropagation()` not working across bricks.
      if (isCurrentTarget(event)) {
        event.preventDefault();
        manager.contextMenuChange({
          active: true,
          node,
          x: event.clientX,
          y: event.clientY,
        });
      }
    },
    [isCurrentTarget, manager, node]
  );

  return (
    <DroppingStatusContext.Provider
      value={{
        droppingStatus,
        setDroppingStatus,
      }}
    >
      <div
        className={classNames(styles.editorContainer, styles[editorType], {
          [styles.transparentContainer]: isTransparentContainer,
          [styles.dropping]: Object.values(droppingStatus).some(Boolean),
          [styles.hover]:
            hover ||
            (contextMenuStatus.active &&
              contextMenuStatus.node.$$uid === nodeUid),
          [styles.isDownstreamNode]: !hover && isDownstreamNode,
          [styles.isUpstreamNode]: !hover && isUpstreamNode,
          [styles.highlight]: highlightNodes.has(nodeUid),
        })}
        style={editorContainerStyle}
        ref={editorContainerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        <div className={styles.nodeAlias}>
          {!hover &&
            (isDownstreamNode ? (
              <span className={styles.arrow}>↓</span>
            ) : isUpstreamNode ? (
              <span className={styles.arrow}>↑</span>
            ) : null)}
          {node.alias || node.brick}
        </div>
        <div className={styles.editorBody} style={editorBodyStyle}>
          {children}
        </div>
      </div>
    </DroppingStatusContext.Provider>
  );
}
