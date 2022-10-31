import { cloneDeep, upperFirst } from "lodash";
import {
  computeConstantCondition,
  normalizeBuilderNode,
} from "@next-core/brick-utils";
import { BuilderRouteOrBrickNode } from "@next-core/brick-types";
import { BuilderRuntimeNode } from "../interfaces";
import { isBrickNode, isRouteNode } from "../assertions";

const nodeIgnoreFields = ["parent", "children", "graphInfo", "mountPoint"];

// Match evaluations and placeholders,
// E.g.: `<% QUERY.x %>` or `${QUERY.x}`.
const computationRegExp = /[<{]/;

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
  let parsedId: string;
  let parsedTestId: string;

  for (const field of jsonFieldsInBrick) {
    const parsed = cloneDeep(
      (normalized as Record<string, unknown>)?.[field]
    ) as Record<string, unknown>;
    parsedFields.push([`$$parsed${upperFirst(field)}`, parsed ?? {}]);

    if (field === "properties") {
      let tempParsedId: string;
      let tempParsedTestId: string;
      if (
        ((tempParsedTestId = (parsed?.dataset as Record<string, string>)
          ?.testid),
        typeof tempParsedTestId === "string") &&
        !computationRegExp.test(tempParsedTestId)
      ) {
        parsedTestId = tempParsedTestId;
      } else if (
        ((tempParsedId = parsed?.id as string),
        typeof tempParsedId === "string") &&
        !computationRegExp.test(tempParsedId)
      ) {
        parsedId = tempParsedId;
        matchedSelectors.push(`#${parsedId}`);
      }
    }
  }

  const isBrick = isBrickNode(nodeData);
  const brickName = isBrick ? nodeData.brick.split(".").pop() : null;

  let unreachable = false;
  if (normalized?.if !== undefined && (isBrick || isRouteNode(nodeData))) {
    const check = { if: normalized.if };
    computeConstantCondition(check);
    if (check.if === false) {
      unreachable = true;
    }
  }

  return Object.fromEntries(
    Object.entries(nodeData)
      .filter((entry) => !nodeIgnoreFields.includes(entry[0]))
      .concat([
        [
          "alias",
          // Ignore alias which equals to brick name.
          (!(isBrick && nodeData.alias === brickName) && nodeData.alias) ||
            (isBrick
              ? nodeData.ref || parsedTestId || parsedId || brickName
              : undefined),
        ],
        ["$$uid", nodeUid],
        ["$$matchedSelectors", matchedSelectors],
        ["$$isTemplateInternalNode", isTemplateInternalNode],
        ["$$normalized", normalized],
        ["$$unreachable", unreachable],
      ])
      .concat(parsedFields)
  ) as BuilderRuntimeNode;
}
