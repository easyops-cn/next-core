/* istanbul-ignore-file */
// Todo(steve): Ignore tests temporarily for potential breaking change in the future.
import React, { useMemo } from "react";
import classNames from "classnames";
import { DropZone } from "../DropZone/DropZone";
import { useDroppingStatusContext } from "../DroppingStatusContext";
import { EditorSlotContentLayout } from "../interfaces";
import { useBuilderNode } from "../hooks/useBuilderNode";

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
  const node = useBuilderNode({ nodeUid });
  const { droppingStatus } = useDroppingStatusContext();

  const delegatedContext = useMemo(() => {
    const delegatedSlots = node.$$delegatedSlots?.get(slotName);
    return delegatedSlots?.length === 1 ? delegatedSlots[0] : null;
  }, [node, slotName]);

  return (
    <div
      className={classNames(styles.slotContainer, {
        [styles.dropping]:
          Object.prototype.hasOwnProperty.call(droppingStatus, slotName) &&
          droppingStatus[slotName],
      })}
      style={slotContainerStyle}
    >
      <div className={styles.slotName}>
        {delegatedContext?.templateMountPoint ?? slotName}
      </div>
      <DropZone
        nodeUid={nodeUid}
        mountPoint={slotName}
        delegatedContext={delegatedContext}
        dropZoneStyle={dropZoneStyle}
        dropZoneBodyStyle={dropZoneBodyStyle}
        slotContentLayout={slotContentLayout}
        showOutlineIfEmpty={showOutlineIfEmpty}
      />
    </div>
  );
}
