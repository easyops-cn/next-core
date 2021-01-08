import { BuilderGroupedChildNode } from "../interfaces";

export interface SortedIdsAfterDropped {
  nodeUids: number[];
  nodeIds: string[];
}

export interface DroppingInfo {
  draggingNodeUid: number;
  draggingNodeId: string | null;
  draggingIndex?: number;
  droppingMountPoint: string;
  droppingSiblingGroups: BuilderGroupedChildNode[];
  droppingIndex: number;
}

/**
 * Get sorted uids and ids of all children of the dropping parent node.
 *
 * @remark
 *
 * When dropping a node from library (add a node) or from a position
 * to a new position (move a node), we only reorder the children of
 * the dropping mount point. But the reorder API requires to reorder
 * all the children of the dropping parent, which maybe across multiple
 * mount points. So we also keep the original order among sibling mount
 * points at the same time.
 *
 * `draggingNodeId` will be `null` when adding a node.
 *
 * Params `droppingInfo.droppingIndex` and `droppingInfo.draggingIndex`
 * is relative to the belonged mount point.
 *
 * And `droppingInfo.draggingIndex` is required when moving a node
 * inside a mount point.
 *
 * ```
 * ▸ micro-view
 *   ├ toolbar
 *   │ │              ←─ [0]
 *   │ ├ button-a <0>
 *   │ │              ←─ [1]
 *   │ └ input-b  <1>
 *   │                ←─ [2]
 *   └ content
 *     │              ←─ [0]
 *     ├ table-a <0>
 *     │              ←─ [1]
 *     ├ grid-b  <1>
 *     │              ←─ [2]
 *     └ tabs-c  <2>
 *                    ←─ [3]
 * <m>: draggingIndex
 * [n]: droppingIndex
 * ```
 *
 * @param droppingInfo - Dropping info.
 *
 * @returns Both sorted uids and ids.
 */
export function getSortedIdsAfterDropped(
  droppingInfo: DroppingInfo
): SortedIdsAfterDropped {
  const {
    draggingNodeUid,
    draggingNodeId,
    draggingIndex,
    droppingMountPoint,
    droppingSiblingGroups,
    droppingIndex,
  } = droppingInfo;
  const fullChildNodes = droppingSiblingGroups.flatMap(
    (group) => group.childNodes
  );
  const nodeUids = droppingSiblingGroups.flatMap((group) => {
    const uids = group.childNodes
      .map((item) => item.$$uid)
      .filter((uid) => uid !== draggingNodeUid);
    if (group.mountPoint === droppingMountPoint) {
      uids.splice(
        (draggingIndex ?? -1) >= 0 && droppingIndex > draggingIndex
          ? droppingIndex - 1
          : droppingIndex,
        0,
        draggingNodeUid
      );
    }
    return uids;
  });
  const nodeIds = nodeUids.map((uid) =>
    uid === draggingNodeUid
      ? draggingNodeId
      : fullChildNodes.find((item) => item.$$uid === uid).id
  );
  return { nodeUids, nodeIds };
}
