/* istanbul-ignore-file */
// Todo(steve): Ignore tests temporarily for potential breaking change in the future.
import React from "react";
import classNames from "classnames";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useBuilderNode } from "../hooks/useBuilderNode";
import { EditorBrickType } from "../interfaces";
import {
  DroppingStatusContext,
  DroppingStatus,
} from "../DroppingStatusContext";

import styles from "./EditorContainer.module.css";

interface EditorContainerProps {
  nodeUid: number;
  brick: string;
  type?: EditorBrickType;
  persistentBackground?: boolean;
  editorContainerStyle?: React.CSSProperties;
  nodeAliasStyle?: React.CSSProperties;
  editorBoxStyle?: React.CSSProperties;
}

export function EditorContainer({
  nodeUid,
  brick,
  type,
  persistentBackground,
  editorContainerStyle,
  nodeAliasStyle,
  editorBoxStyle,
  children,
}: React.PropsWithChildren<EditorContainerProps>): React.ReactElement {
  const [droppingStatus, setDroppingStatus] = React.useState<DroppingStatus>(
    {}
  );
  const editorContainerRef = React.useRef<HTMLDivElement>();
  const node = useBuilderNode({ nodeUid });
  const editorType = type ?? EditorBrickType.DEFAULT;

  return (
    <DndProvider backend={HTML5Backend}>
      <DroppingStatusContext.Provider
        value={{
          droppingStatus,
          setDroppingStatus,
        }}
      >
        <div
          className={classNames(styles.editorContainer, styles[editorType], {
            [styles.dropping]: Object.values(droppingStatus).some(Boolean),
            [styles.persistentBackground]: persistentBackground,
          })}
          style={editorContainerStyle}
          ref={editorContainerRef}
        >
          <div className={styles.nodeAlias} style={nodeAliasStyle}>
            {node.alias || node.brick}
          </div>
          <div className={styles.editorBox} style={editorBoxStyle}>
            {children}
          </div>
        </div>
      </DroppingStatusContext.Provider>
    </DndProvider>
  );
}
