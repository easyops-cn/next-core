import React, { useCallback, useEffect, useRef, useState } from "react";
import classNames from "classnames";
import { EditorBrickType } from "../interfaces";
import { useBuilderNode } from "../hooks/useBuilderNode";
import { useBuilderDataManager } from "../hooks/useBuilderDataManager";
import { useBuilderContextMenuStatus } from "../hooks/useBuilderContextMenuStatus";
import { useShowRelatedNodesBasedOnEvents } from "../hooks/useShowRelatedNodesBasedOnEvents";
import { isCurrentTargetByClassName } from "./isCurrentTargetByClassName";
import { useHoverNodeUid } from "../hooks/useHoverNodeUid";
import { useHighlightNodes } from "../hooks/useHighlightNodes";
import { useDroppingStatus } from "../hooks/useDroppingStatus";

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
  const editorContainerRef = useRef<HTMLDivElement>();
  const highlightNodes = useHighlightNodes();
  const node = useBuilderNode({ nodeUid });
  const [isUpstreamNode, setIsUpstreamNode] = useState(false);
  const [isDownstreamNode, setIsDownstreamNode] = useState(false);
  const contextMenuStatus = useBuilderContextMenuStatus();
  const hoverNodeUid = useHoverNodeUid();
  const showRelatedEvents = useShowRelatedNodesBasedOnEvents();
  const manager = useBuilderDataManager();
  const [hover, setHover] = useState(hoverNodeUid === nodeUid);
  const editorType = type ?? EditorBrickType.DEFAULT;
  const hoverNodeUidRef = useRef(hoverNodeUid);
  const droppingStatus = useDroppingStatus();

  useEffect(() => {
    hoverNodeUidRef.current = hoverNodeUid;
  }, [hoverNodeUid]);

  const handleMouseOver = useCallback(
    (event: MouseEvent) => {
      event.stopPropagation();
      setHover(true);
      if (hoverNodeUidRef.current !== nodeUid) {
        manager.setHoverNodeUid(nodeUid);
      }
    },
    [nodeUid, manager]
  );

  const handleMouseOut = useCallback(
    (event: MouseEvent) => {
      event.stopPropagation();
      setHover(false);
      if (hoverNodeUidRef.current === nodeUid) {
        manager.setHoverNodeUid(undefined);
      }
    },
    [nodeUid, manager]
  );

  useEffect(() => {
    if (node.$$isTemplateInternalNode) {
      return;
    }
    // Manually bind listeners since events which cross custom-elements
    // seem not working in React v16.
    const editorContainer = editorContainerRef.current;
    editorContainer.addEventListener("mouseover", handleMouseOver);
    editorContainer.addEventListener("mouseout", handleMouseOut);
    return () => {
      editorContainer.removeEventListener("mouseover", handleMouseOver);
      editorContainer.removeEventListener("mouseout", handleMouseOut);
    };
  }, [handleMouseOver, handleMouseOut, node]);

  useEffect(() => {
    if (node.$$isTemplateInternalNode) {
      return;
    }
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
  }, [hoverNodeUid, node, nodeUid, showRelatedEvents, manager]);

  const isCurrentTarget = useCallback(
    (event: React.MouseEvent) =>
      !node.$$isTemplateInternalNode &&
      isCurrentTargetByClassName(
        event.target as HTMLElement,
        editorContainerRef.current
      ),
    [node]
  );

  const handleClick = useCallback(
    (event: React.MouseEvent) => {
      // `event.stopPropagation()` not working across bricks.
      if (isCurrentTarget(event)) {
        manager.nodeClick(node);
      }
    },
    [isCurrentTarget, manager, node]
  );

  const handleContextMenu = useCallback(
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
    <div
      className={classNames(styles.editorContainer, styles[editorType], {
        [styles.transparentContainer]: isTransparentContainer,
        [styles.dropping]: Array.from(
          droppingStatus.get(nodeUid)?.values() ?? []
        ).some(Boolean),
        [styles.hover]: hover,
        [styles.active]:
          contextMenuStatus.active && contextMenuStatus.node.$$uid === nodeUid,
        [styles.isDownstreamNode]: !hover && isDownstreamNode,
        [styles.isUpstreamNode]: !hover && isUpstreamNode,
        [styles.highlight]: highlightNodes.has(nodeUid),
        [styles.isTemplateInternalNode]: node.$$isTemplateInternalNode,
      })}
      style={editorContainerStyle}
      ref={editorContainerRef}
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
  );
}
