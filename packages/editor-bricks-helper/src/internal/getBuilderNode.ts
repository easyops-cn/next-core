import { BuilderRouteOrBrickNode } from "@easyops/brick-types";
import { BuilderRuntimeNode } from "../interfaces";

const nodeIgnoreFields = ["parent", "children", "graphInfo", "mountPoint"];

export function getBuilderNode(
  nodeData: BuilderRouteOrBrickNode,
  nodeUid: number,
  nodeAlias?: string
): BuilderRuntimeNode {
  let parsedProperties: Record<string, unknown>;
  if (nodeData.properties) {
    try {
      parsedProperties = JSON.parse(nodeData.properties as string);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Parsing properties failed:", nodeData.properties);
    }
  }

  return Object.fromEntries(
    Object.entries(nodeData)
      .filter((entry) => !nodeIgnoreFields.includes(entry[0]))
      .concat([
        ["alias", nodeAlias ?? nodeData.alias],
        ["$$uid", nodeUid],
        ["parsedProperties", parsedProperties ?? {}],
      ])
  ) as BuilderRuntimeNode;
}
