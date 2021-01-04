import { BuilderGroupedChildNode } from "../interfaces";

export interface SortedIdsAfterDropped {
  nodeUids: number[];
  nodeIds: string[];
}

export interface DroppingInfo {
  draggingNodeUid: number;
  draggingNodeId: string;
  dropIndex: number;
  originalIndex?: number;
  mountPoint: string;
  groupedChildNodes: BuilderGroupedChildNode[];
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
 * Params `droppingInfo.dropIndex` and `droppingInfo.originalIndex`
 * is relative to the belonged mount point.
 *
 * And `droppingInfo.originalIndex` is required when moving a node
 * inside a mount point.
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
    dropIndex,
    originalIndex,
    mountPoint,
    groupedChildNodes,
  } = droppingInfo;
  const fullChildNodes = groupedChildNodes.flatMap((group) => group.childNodes);
  const nodeUids = groupedChildNodes.flatMap((group) => {
    const uids = group.childNodes
      .map((item) => item.$$uid)
      .filter((uid) => uid !== draggingNodeUid);
    if (group.mountPoint === mountPoint) {
      uids.splice(
        (originalIndex ?? -1) >= 0 && dropIndex > originalIndex
          ? dropIndex - 1
          : dropIndex,
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
