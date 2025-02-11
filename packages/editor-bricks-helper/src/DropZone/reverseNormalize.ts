import yaml from "js-yaml";
import { BrickConf } from "@next-core/brick-types";
import { SnippetNodeInstance } from "../interfaces";

const jsonFieldsInBrick = [
  "properties",
  "events",
  "lifeCycle",
  "params",
  "if",
  "transform",
  "dataSource",
];
const yamlFieldsInBrick = ["permissionsPreCheck", "transformFrom"];
const ignoredFieldsInBrick = [
  "brick",
  "template",
  "portal",
  "slots",
  "id",
  "children",
  "instanceId",
];

export interface ReverseNormalizeContext {
  isPortalCanvas: boolean;
  nodeData: {
    type: "brick" | "template" | "provider";
    parent: string;
    mountPoint: string;
    sort: number;
  };
}

// The reverse operation of *normalize*.
// https://github.com/easyops-cn/next-basics/blob/5a6710d567821bcb4a0c71e22d55212193d8b0cb/bricks/next-builder/src/shared/storyboard/buildStoryboard.ts#L394
export function reverseNormalize(
  brickConf: BrickConf,
  ctx: ReverseNormalizeContext
): SnippetNodeInstance {
  return Object.fromEntries(
    Object.entries(brickConf)
      .map<[string, unknown]>(([key, value]) =>
        value === undefined || ignoredFieldsInBrick.includes(key)
          ? undefined
          : jsonFieldsInBrick.includes(key)
          ? [key, JSON.stringify(value)]
          : yamlFieldsInBrick.includes(key)
          ? [key, yaml.safeDump(value)]
          : [key, value]
      )
      .filter(Boolean)
      .concat(Object.entries(ctx.nodeData), [
        [
          "brick",
          ctx.nodeData.type === "template"
            ? brickConf.template
            : brickConf.brick,
        ],
        ["portal", ctx.isPortalCanvas || brickConf.portal],
      ])
  ) as SnippetNodeInstance;
}
