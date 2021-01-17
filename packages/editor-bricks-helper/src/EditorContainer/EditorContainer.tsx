/* istanbul-ignore-file */
// Todo(steve): Ignore tests temporarily for potential breaking change in the future.
import React from "react";
import classNames from "classnames";
import { EditorBrickType } from "../interfaces";
import {
  DroppingStatusContext,
  DroppingStatus,
} from "../DroppingStatusContext";
import { useBuilderNode } from "../hooks/useBuilderNode";
import { useBuilderDataManager } from "../hooks/useBuilderDataManager";
import { useBuilderContextMenuStatus } from "../hooks/useBuilderContextMenuStatus";
import { isCurrentTargetByClassName } from "./isCurrentTargetByClassName";

import styles from "./EditorContainer.module.css";

interface EditorContainerProps {
  nodeUid: number;
  brick: string;
  type?: EditorBrickType;
  isTransparentContainer?: boolean;
  editorContainerStyle?: React.CSSProperties;
  editorBodyStyle?: React.CSSProperties;
}

export function EditorContainer({
  nodeUid,
  brick,
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
  const node = useBuilderNode({ nodeUid });
  const [hover, setHover] = React.useState(false);
  const contextMenuStatus = useBuilderContextMenuStatus();
  const manager = useBuilderDataManager();
  const editorType = type ?? EditorBrickType.DEFAULT;

  const handleMouseEnter = React.useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    setHover(true);
  }, []);

  const handleMouseLeave = React.useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    setHover(false);
  }, []);

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
        })}
        style={editorContainerStyle}
        ref={editorContainerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        <div className={styles.nodeAlias}>{node.alias || node.brick}</div>
        <div className={styles.editorBody} style={editorBodyStyle}>
          {children}
        </div>
      </div>
    </DroppingStatusContext.Provider>
  );
}
