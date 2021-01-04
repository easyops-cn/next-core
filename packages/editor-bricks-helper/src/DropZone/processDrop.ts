import {
  BuilderDataTransferPayloadOfNodeToAdd,
  BuilderDataTransferPayloadOfNodeToMove,
  BuilderDataTransferType,
  BuilderEventType,
  BuilderGroupedChildNode,
  BuilderRuntimeNode,
  EventDetailOfNodeAdd,
  EventDetailOfNodeMove,
  EventDetailOfNodeReorder,
} from "../interfaces";
import { getUniqueNodeId } from "../internal/getUniqueNodeId";
import { getSortedIdsAfterDropped } from "./getSortedIdsAfterDropped";

export interface HandleDropParams {
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
    window.dispatchEvent(
      new CustomEvent<EventDetailOfNodeAdd>(BuilderEventType.NODE_ADD, {
        detail: {
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
        },
      })
    );
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
        window.dispatchEvent(
          new CustomEvent<EventDetailOfNodeReorder>(
            BuilderEventType.NODE_REORDER,
            {
              detail: {
                ...getSortedIdsAfterDropped({
                  draggingNodeUid,
                  draggingNodeId,
                  dropIndex,
                  originalIndex,
                  mountPoint,
                  groupedChildNodes,
                }),
                parentUid,
              },
            }
          )
        );
      }
    } else {
      window.dispatchEvent(
        new CustomEvent<EventDetailOfNodeMove>(BuilderEventType.NODE_MOVE, {
          detail: {
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
          },
        })
      );
    }
  }
}
