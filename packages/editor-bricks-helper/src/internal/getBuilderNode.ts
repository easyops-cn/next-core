import { upperFirst } from "lodash";
import { BuilderRouteOrBrickNode } from "@next-core/brick-types";
import { BuilderRuntimeNode } from "../interfaces";
import { isBrickNode } from "../assertions";

const nodeIgnoreFields = ["parent", "children", "graphInfo", "mountPoint"];

export function getBuilderNode(
  nodeData: BuilderRouteOrBrickNode,
  nodeUid: number,
  isTemplateInternalNode?: boolean
): BuilderRuntimeNode {
  const matchedSelectors: string[] = [];

  if (nodeData.brick) {
    matchedSelectors.push((nodeData.brick as string).replace(/\./g, "\\."));
  }

  const jsonFieldsInBrick = ["properties", "events", "lifeCycle"];
  const parsedFields: [string, unknown][] = [];

  for (const field of jsonFieldsInBrick) {
    let parsed;
    const value = nodeData[field] as string;
    if (value) {
      try {
        parsed = JSON.parse(value);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(`Parsing ${field} failed:`, value);
      }
    }
    parsedFields.push([`$$parsed${upperFirst(field)}`, parsed ?? {}]);

    if (
      field === "properties" &&
      parsed?.id &&
      typeof parsed.id === "string" &&
      // Ignore evaluations and placeholders,
      // E.g.: `<% QUERY.x %>` or `${QUERY.x}`.
      !/[<{]/.test(parsed.id)
    ) {
      matchedSelectors.push(`#${parsed.id}`);
    }
  }

  return Object.fromEntries(
    Object.entries(nodeData)
      .filter((entry) => !nodeIgnoreFields.includes(entry[0]))
      .concat([
        [
          "alias",
          nodeData.alias ??
            (isBrickNode(nodeData)
              ? nodeData.brick.split(".").pop()
              : undefined),
        ],
        ["$$uid", nodeUid],
        ["$$matchedSelectors", matchedSelectors],
        ["$$isTemplateInternalNode", isTemplateInternalNode],
      ])
      .concat(parsedFields)
  ) as BuilderRuntimeNode;
}
