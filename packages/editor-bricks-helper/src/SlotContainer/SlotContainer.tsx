/* istanbul-ignore-file */
// Todo(steve): Ignore tests temporarily for potential breaking change in the future.
import React from "react";
import classNames from "classnames";
import { DropZone } from "../DropZone/DropZone";
import { useDroppingStatusContext } from "../DroppingStatusContext";
import { EditorSlotContentLayout } from "../interfaces";

import styles from "./SlotContainer.module.css";

export interface SlotContainerProps {
  nodeUid: number;
  slotName: string;
  slotContainerStyle?: React.CSSProperties;
  dropZoneStyle?: React.CSSProperties;
  slotContentLayout?: EditorSlotContentLayout;
  showOutlineIfEmpty?: boolean;
}

export function SlotContainer({
  nodeUid,
  slotName,
  slotContainerStyle,
  dropZoneStyle,
  slotContentLayout,
  showOutlineIfEmpty,
}: SlotContainerProps): React.ReactElement {
  const { dropping, droppingMountPoint } = useDroppingStatusContext();
  return (
    <div
      className={classNames(styles.slotContainer, {
        [styles.dropping]: dropping && droppingMountPoint === slotName,
      })}
      style={slotContainerStyle}
    >
      <DropZone
        nodeUid={nodeUid}
        mountPoint={slotName}
        dropZoneStyle={dropZoneStyle}
        slotContentLayout={slotContentLayout}
        showOutlineIfEmpty={showOutlineIfEmpty}
      />
      <div className={styles.slotName}>{slotName}</div>
    </div>
  );
}
