import {
  BuilderDataTransferPayloadOfNodeToAdd,
  BuilderDataTransferPayloadOfNodeToMove,
  BuilderDataTransferPayloadOfSnippetToApply,
  BuilderDataTransferType,
  BuilderGroupedChildNode,
  BuilderRuntimeNode,
} from "../interfaces";
import { BuilderDataManager } from "../internal/BuilderDataManager";
import { getUniqueNodeId } from "../internal/getUniqueNodeId";
import { getSortedIdsAfterDropped } from "../processors/getSortedIdsAfterDropped";
import { getSnippetNodeDetail } from "./getSnippetNodeDetail";

export interface HandleDropParams {
  manager: BuilderDataManager;
  type: BuilderDataTransferType;
  data:
    | BuilderDataTransferPayloadOfNodeToAdd
    | BuilderDataTransferPayloadOfNodeToMove
    | BuilderDataTransferPayloadOfSnippetToApply;
  droppingIndex: number;
  droppingParentUid: number;
  droppingParentInstanceId: string;
  droppingMountPoint: string;
  droppingChildNodes: BuilderRuntimeNode[];
  droppingSiblingGroups: BuilderGroupedChildNode[];
  isPortalCanvas?: boolean;
}

export function processDrop({
  manager,
  type,
  data,
  droppingIndex,
  droppingParentUid,
  droppingParentInstanceId,
  droppingMountPoint,
  droppingChildNodes,
  droppingSiblingGroups,
  isPortalCanvas,
}: HandleDropParams): void {
  if (type === BuilderDataTransferType.NODE_TO_ADD) {
    // Drag a new node into canvas.
    const { brickType = "brick", brick } =
      data as BuilderDataTransferPayloadOfNodeToAdd;
    const draggingNodeUid = getUniqueNodeId();
    manager.nodeAdd({
      ...getSortedIdsAfterDropped({
        draggingNodeUid,
        draggingNodeId: null,
        droppingIndex,
        droppingMountPoint,
        droppingSiblingGroups,
      }),
      nodeUid: draggingNodeUid,
      parentUid: droppingParentUid,
      nodeData: {
        parent: droppingParentInstanceId,
        type: brickType,
        brick,
        mountPoint: droppingMountPoint,
        bg: !isPortalCanvas && brickType === "provider" ? true : undefined,
        portal: isPortalCanvas,
      },
    });
  } else if (type === BuilderDataTransferType.SNIPPET_TO_APPLY) {
    const { bricks } = data as BuilderDataTransferPayloadOfSnippetToApply;
    // https://stackoverflow.com/questions/5501581/javascript-new-arrayn-and-array-prototype-map-weirdness
    const draggingNodeUids = [...new Array(bricks.length)].map(() =>
      getUniqueNodeId()
    );
    manager.snippetApply({
      ...getSortedIdsAfterDropped({
        draggingNodeUid: draggingNodeUids,
        draggingNodeId: null,
        droppingIndex,
        droppingMountPoint,
        droppingSiblingGroups,
      }),
      parentUid: droppingParentUid,
      nodeDetails: bricks.map((brickConf, index) =>
        getSnippetNodeDetail({
          parent: droppingParentInstanceId,
          parentUid: droppingParentUid,
          mountPoint: droppingMountPoint,
          nodeUid: draggingNodeUids[index],
          brickConf,
          isPortalCanvas,
        })
      ),
    });
  } else if (type === BuilderDataTransferType.NODE_TO_MOVE) {
    const {
      nodeUid: draggingNodeUid,
      nodeId: draggingNodeId,
      nodeInstanceId: draggingNodeInstanceId,
    } = data as BuilderDataTransferPayloadOfNodeToMove;

    const draggingIndex = droppingChildNodes.findIndex(
      (item) => item.$$uid === draggingNodeUid
    );
    // If found dragging node in the same drop zone,
    // then apply a node reorder, otherwise apply a node move.
    if (draggingIndex >= 0) {
      // If the index is not changed, then there is nothing to do.
      if (
        droppingIndex !== draggingIndex &&
        droppingIndex !== draggingIndex + 1
      ) {
        manager.nodeReorder({
          ...getSortedIdsAfterDropped({
            draggingNodeUid,
            draggingNodeId,
            draggingIndex,
            droppingIndex,
            droppingMountPoint,
            droppingSiblingGroups,
          }),
          parentUid: droppingParentUid,
        });
      }
    } else {
      manager.nodeMove({
        ...getSortedIdsAfterDropped({
          draggingNodeUid,
          draggingNodeId,
          droppingIndex,
          droppingMountPoint,
          droppingSiblingGroups,
        }),
        nodeUid: draggingNodeUid,
        parentUid: droppingParentUid,
        nodeInstanceId: draggingNodeInstanceId,
        nodeData: {
          parent: droppingParentInstanceId,
          mountPoint: droppingMountPoint,
        },
      });
    }
  }
}
