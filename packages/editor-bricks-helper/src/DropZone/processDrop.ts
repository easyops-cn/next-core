import {
  BuilderDataTransferPayloadOfNodeToAdd,
  BuilderDataTransferPayloadOfNodeToMove,
  BuilderDataTransferType,
  BuilderGroupedChildNode,
  BuilderRuntimeNode,
} from "../interfaces";
import { BuilderDataManager } from "../internal/BuilderDataManager";
import { getUniqueNodeId } from "../internal/getUniqueNodeId";
import { getSortedIdsAfterDropped } from "../processors/getSortedIdsAfterDropped";

export interface HandleDropParams {
  manager: BuilderDataManager;
  type: BuilderDataTransferType;
  data:
    | BuilderDataTransferPayloadOfNodeToAdd
    | BuilderDataTransferPayloadOfNodeToMove;
  dropIndex: number;
  parentUid: number;
  parentInstanceId: string;
  mountPoint: string;
  selfChildNodes: BuilderRuntimeNode[];
  groupedChildNodes: BuilderGroupedChildNode[];
}

export function processDrop({
  manager,
  type,
  data,
  dropIndex,
  parentUid,
  parentInstanceId,
  mountPoint,
  selfChildNodes,
  groupedChildNodes,
}: HandleDropParams): void {
  if (type === BuilderDataTransferType.NODE_TO_ADD) {
    // Drag a new node into canvas.
    const brick = (data as BuilderDataTransferPayloadOfNodeToAdd).brick;
    const draggingNodeUid = getUniqueNodeId();
    manager.nodeAdd({
      ...getSortedIdsAfterDropped({
        draggingNodeUid,
        draggingNodeId: null,
        dropIndex,
        mountPoint,
        groupedChildNodes,
      }),
      nodeUid: draggingNodeUid,
      parentUid,
      nodeAlias: brick.split(".").pop(),
      nodeData: {
        parent: parentInstanceId,
        type: "brick",
        brick,
        mountPoint,
      },
    });
  } else if (type === BuilderDataTransferType.NODE_TO_MOVE) {
    const {
      nodeUid: draggingNodeUid,
      nodeInstanceId,
      nodeId: draggingNodeId,
    } = data as BuilderDataTransferPayloadOfNodeToMove;

    const originalIndex = selfChildNodes.findIndex(
      (item) => item.$$uid === draggingNodeUid
    );
    // If found dragging node in the same drop zone,
    // then apply a node reorder, else apply a node move.
    if (originalIndex >= 0) {
      // If the index is not changed, then there is nothing to do.
      if (dropIndex !== originalIndex && dropIndex !== originalIndex + 1) {
        manager.nodeReorder({
          ...getSortedIdsAfterDropped({
            draggingNodeUid,
            draggingNodeId,
            dropIndex,
            originalIndex,
            mountPoint,
            groupedChildNodes,
          }),
          parentUid,
        });
      }
    } else {
      manager.nodeMove({
        ...getSortedIdsAfterDropped({
          draggingNodeUid,
          draggingNodeId,
          dropIndex,
          mountPoint,
          groupedChildNodes,
        }),
        nodeUid: draggingNodeUid,
        parentUid,
        nodeInstanceId,
        nodeData: {
          parent: parentInstanceId,
          mountPoint,
        },
      });
    }
  }
}
