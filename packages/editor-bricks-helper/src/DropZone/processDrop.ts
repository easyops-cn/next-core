import { BrickConf, SlotConfOfBricks } from "@next-core/brick-types/dist/types";
import {
  BuilderDataTransferPayloadOfNodeToAdd,
  BuilderDataTransferPayloadOfNodeToMove,
  BuilderDataTransferPayloadOfSnippetToApply,
  BuilderDataTransferType,
  BuilderGroupedChildNode,
  BuilderRuntimeNode,
  SnippetNodeDetail,
} from "../interfaces";
import { BuilderDataManager } from "../internal/BuilderDataManager";
import { getUniqueNodeId } from "../internal/getUniqueNodeId";
import { getSortedIdsAfterDropped } from "../processors/getSortedIdsAfterDropped";

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

export function stringifyJsonFieldsInBrickConf(brickConf: BrickConf): {
  properties?: string;
  events?: string;
  lifeCycle?: string;
} {
  const jsonFieldsInBrick = ["properties", "events", "lifeCycle"] as const;
  return Object.fromEntries(
    jsonFieldsInBrick
      .filter((field) => brickConf[field])
      .map((field) => [field, JSON.stringify(brickConf[field])])
  );
}

export function getSnippetNodeDescription({
  parent,
  parentUid,
  mountPoint,
  nodeUid,
  brickConf,
  isPortalCanvas,
  sort,
}: {
  parent?: string;
  parentUid: number;
  mountPoint: string;
  nodeUid: number;
  brickConf: BrickConf;
  isPortalCanvas?: boolean;
  sort?: number;
}): SnippetNodeDetail {
  return {
    nodeUid,
    nodeAlias: brickConf.brick.split(".").pop(),
    parentUid,
    nodeData: {
      parent,
      type: "brick",
      brick: brickConf.brick,
      mountPoint,
      bg: brickConf.bg,
      portal: isPortalCanvas || brickConf.portal,
      sort,
      ...stringifyJsonFieldsInBrickConf(brickConf),
    },
    children: brickConf.slots
      ? Object.entries(brickConf.slots)
          .flatMap(([mountPoint, slotConf]) =>
            (slotConf as SlotConfOfBricks).bricks.map((childBrickConf) => ({
              childBrickConf,
              mountPoint,
            }))
          )
          .map(({ childBrickConf, mountPoint }, index) =>
            getSnippetNodeDescription({
              parentUid: nodeUid,
              mountPoint,
              nodeUid: getUniqueNodeId(),
              brickConf: childBrickConf,
              sort: index,
            })
          )
      : [],
  };
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
      nodeAlias: brick.split(".").pop(),
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
        getSnippetNodeDescription({
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
