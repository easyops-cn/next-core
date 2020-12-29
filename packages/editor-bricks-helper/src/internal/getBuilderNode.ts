import { BuilderRouteOrBrickNode } from "@easyops/brick-types";
import { BuilderRuntimeNode } from "../interfaces";

const nodeIgnoreFields = ["parent", "children", "graphInfo", "mountPoint"];

export function getBuilderNode(
  nodeData: BuilderRouteOrBrickNode,
  nodeUid: number,
  nodeAlias?: string
): BuilderRuntimeNode {
  return Object.fromEntries(
    Object.entries(nodeData)
      .filter((entry) => !nodeIgnoreFields.includes(entry[0]))
      .concat([
        ["alias", nodeAlias ?? nodeData.alias],
        ["$$uid", nodeUid],
      ])
  ) as BuilderRuntimeNode;
}
