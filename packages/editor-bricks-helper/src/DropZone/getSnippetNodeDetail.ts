import { BrickConf, SlotConfOfBricks } from "@next-core/brick-types";
import { SnippetNodeDetail } from "../interfaces";
import { getUniqueNodeId } from "../internal/getUniqueNodeId";
import { reverseNormalize } from "./reverseNormalize";

export function getSnippetNodeDetail({
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
  const type = brickConf.template
    ? "template"
    : brickConf.bg
    ? "provider"
    : "brick";

  return {
    nodeUid,
    parentUid,
    nodeData: reverseNormalize(brickConf, {
      isPortalCanvas,
      nodeData: {
        type,
        parent,
        mountPoint,
        sort,
      },
    }),
    children: brickConf.slots
      ? Object.entries(brickConf.slots)
          .flatMap(([mountPoint, slotConf]) =>
            (slotConf as SlotConfOfBricks).bricks.map((childBrickConf) => ({
              childBrickConf,
              mountPoint,
            }))
          )
          .map(({ childBrickConf, mountPoint }, index) =>
            getSnippetNodeDetail({
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
