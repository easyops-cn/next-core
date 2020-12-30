/* istanbul-ignore-file */
// Todo(steve): Ignore tests temporarily for potential breaking change in the future.
import React from "react";
import classNames from "classnames";
import { useBuilderNode } from "../hooks/useBuilderNode";
import { EditorBrickType } from "../interfaces";
import { DroppingStatusContext } from "../DroppingStatusContext";

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
  const [dropping, setDropping] = React.useState(false);
  const [droppingMountPoint, setDroppingMountPoint] = React.useState<string>();
  const editorContainerRef = React.useRef<HTMLDivElement>();
  const node = useBuilderNode({ nodeUid });
  const editorType = type ?? EditorBrickType.DEFAULT;

  return (
    <DroppingStatusContext.Provider
      value={{
        dropping,
        setDropping,
        droppingMountPoint,
        setDroppingMountPoint,
      }}
    >
      <div
        className={classNames(styles.editorContainer, styles[editorType], {
          [styles.dropping]: dropping,
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
  );
}
