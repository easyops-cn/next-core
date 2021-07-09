/* istanbul-ignore-file */
// Todo(steve): Ignore tests temporarily for potential breaking change in the future.
import React, { useMemo } from "react";
import classNames from "classnames";
import { DropZone } from "../DropZone/DropZone";
import { EditorSlotContentLayout } from "../interfaces";
import { useBuilderNode } from "../hooks/useBuilderNode";
import { useDroppingStatus } from "../hooks/useDroppingStatus";

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
  const droppingStatus = useDroppingStatus();

  const delegatedContext = useMemo(() => {
    const delegatedSlots = node.$$delegatedSlots?.get(slotName);
    // Ignore when there are more than one delegated slots on a single slot.
    return delegatedSlots?.length === 1 ? delegatedSlots[0] : null;
  }, [node, slotName]);

  return (
    <div
      className={classNames(styles.slotContainer, {
        [styles.dropping]: droppingStatus
          .get(delegatedContext ? delegatedContext.templateUid : nodeUid)
          ?.get(
            delegatedContext ? delegatedContext.templateMountPoint : slotName
          ),
      })}
      style={slotContainerStyle}
    >
      <div className={styles.slotName}>
        {delegatedContext ? delegatedContext.templateMountPoint : slotName}
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
