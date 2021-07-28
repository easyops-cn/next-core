import { cloneDeep, upperFirst } from "lodash";
import { normalizeBuilderNode } from "@next-core/brick-utils";
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

  const normalized = normalizeBuilderNode(nodeData);

  const jsonFieldsInBrick = ["properties", "events", "lifeCycle"];
  const parsedFields: [string, unknown][] = [];

  for (const field of jsonFieldsInBrick) {
    const parsed = cloneDeep(
      (normalized as Record<string, unknown>)?.[field]
    ) as Record<string, unknown>;
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
        ["$$normalized", normalized],
      ])
      .concat(parsedFields)
  ) as BuilderRuntimeNode;
}
