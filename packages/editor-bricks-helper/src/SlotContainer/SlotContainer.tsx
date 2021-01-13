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
  dropZoneBodyStyle?: React.CSSProperties;
  slotContentLayout?: EditorSlotContentLayout;
  showOutlineIfEmpty?: boolean;
}

export function SlotContainer({
  nodeUid,
  slotName,
  slotContainerStyle,
  dropZoneStyle,
  dropZoneBodyStyle,
  slotContentLayout,
  showOutlineIfEmpty,
}: SlotContainerProps): React.ReactElement {
  const { droppingStatus } = useDroppingStatusContext();
  return (
    <div
      className={classNames(styles.slotContainer, {
        [styles.dropping]:
          Object.prototype.hasOwnProperty.call(droppingStatus, slotName) &&
          droppingStatus[slotName],
      })}
      style={slotContainerStyle}
    >
      <div className={styles.slotName}>{slotName}</div>
      <DropZone
        nodeUid={nodeUid}
        mountPoint={slotName}
        dropZoneStyle={dropZoneStyle}
        dropZoneBodyStyle={dropZoneBodyStyle}
        slotContentLayout={slotContentLayout}
        showOutlineIfEmpty={showOutlineIfEmpty}
      />
    </div>
  );
}
