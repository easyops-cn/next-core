/* istanbul-ignore-file */
// Todo(steve): Ignore tests temporarily for potential breaking change in the future.
import React from "react";
import classNames from "classnames";
import { useBuilderNode } from "../hooks/useBuilderNode";
import { EditorBrickType } from "../interfaces";
import {
  DroppingStatusContext,
  DroppingStatus,
} from "../DroppingStatusContext";

import styles from "./EditorContainer.module.css";
import { useBuilderDataManager } from "../hooks/useBuilderDataManager";

interface EditorContainerProps {
  nodeUid: number;
  brick: string;
  type?: EditorBrickType;
  isTransparentContainer?: boolean;
  editorContainerStyle?: React.CSSProperties;
  /** @deprecated Use `editorBodyStyle` instead. */
  editorBoxStyle?: React.CSSProperties;
  editorBodyStyle?: React.CSSProperties;
}

export function EditorContainer({
  nodeUid,
  brick,
  type,
  isTransparentContainer,
  editorContainerStyle,
  editorBoxStyle,
  editorBodyStyle,
  children,
}: React.PropsWithChildren<EditorContainerProps>): React.ReactElement {
  const [droppingStatus, setDroppingStatus] = React.useState<DroppingStatus>(
    {}
  );
  const editorContainerRef = React.useRef<HTMLDivElement>();
  const node = useBuilderNode({ nodeUid });
  const editorType = type ?? EditorBrickType.DEFAULT;
  const [hover, setHover] = React.useState(false);
  const manager = useBuilderDataManager();

  const handleMouseEnter = React.useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    setHover(true);
  }, []);

  const handleMouseLeave = React.useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    setHover(false);
  }, []);

  const isCurrentTarget = React.useCallback((event: React.MouseEvent) => {
    let element = event.target as HTMLElement;
    while (element) {
      if (element === editorContainerRef.current) {
        return true;
      }
      if (element.classList.contains(styles.editorContainer)) {
        return false;
      }
      element = element.parentElement;
    }
  }, []);

  const handleClick = React.useCallback(
    (event: React.MouseEvent) => {
      // `event.stopPropagation()` not working here.
      if (isCurrentTarget(event)) {
        manager.nodeClick(node);
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
          [styles.hover]: hover,
        })}
        style={editorContainerStyle}
        ref={editorContainerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        <div className={styles.nodeAlias}>{node.alias || node.brick}</div>
        <div
          className={styles.editorBody}
          style={editorBodyStyle || editorBoxStyle}
        >
          {children}
        </div>
      </div>
    </DroppingStatusContext.Provider>
  );
}
