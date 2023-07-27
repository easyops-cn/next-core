import yaml from "js-yaml";
import { cloneDeep } from "lodash";
import {
  BrickConf,
  BuilderBrickNode,
  BuilderCustomTemplateNode,
  BuilderRouteNode,
  BuilderRouteOrBrickNode,
  BuilderSnippetNode,
  RouteConf,
  SeguesConf,
} from "@next-core/brick-types";
import { isBrickNode, isRouteNode } from "./assertions";

const jsonFieldsInRoute = [
  "menu",
  "providers",
  "segues",
  "defineResolves",
  "redirect",
  "analyticsData",
];

// Fields stored as yaml string will be parsed when build & push.
const yamlFieldsInRoute = ["permissionsPreCheck", "if"];

const jsonFieldsInBrick = [
  "properties",
  "events",
  "lifeCycle",
  "params",
  "if",
  "transform",
  "dataSource",
];

// Fields stored as yaml string will be parsed when build & push.
const yamlFieldsInBrick = ["permissionsPreCheck", "transformFrom"];

// Fields started with `_` will be removed by default.
const fieldsToRemoveInRoute = [
  "appId",
  "children",
  "creator",
  "ctime",
  "id",
  "graphInfo",
  "modifier",
  "mountPoint",
  "mtime",
  "org",
  "parent",
  "sort",
  "name",
  "providersBak",
  "providers_bak",
  "previewSettings",
  "screenshot",
  "lock",

  "deleteAuthorizers",
  "readAuthorizers",
  "updateAuthorizers",
];

const fieldsToRemoveInBrick = fieldsToRemoveInRoute.concat("type");

// Those fields can be disposed if value is null.
const disposableNullFields = [
  "alias",
  "documentId",
  "context",
  "exports",
  "ref",
  "analyticsData",
];

const disposableFalseOrNullFields = [
  "hybrid",
  "bg",
  "portal",
  "public",
  "exact",
];

export function normalizeBuilderNode(node: BuilderBrickNode): BrickConf;
export function normalizeBuilderNode(node: BuilderRouteNode): RouteConf;
export function normalizeBuilderNode(
  node: BuilderCustomTemplateNode | BuilderSnippetNode
): null;
export function normalizeBuilderNode(
  node: BuilderRouteOrBrickNode
): BrickConf | RouteConf | null;
export function normalizeBuilderNode(
  node: BuilderRouteOrBrickNode
): BrickConf | RouteConf | null {
  if (isBrickNode(node)) {
    return normalize(
      node,
      fieldsToRemoveInBrick,
      jsonFieldsInBrick,
      yamlFieldsInBrick,
      "brick"
    ) as unknown as BrickConf;
  }
  if (isRouteNode(node)) {
    return normalize(
      node,
      fieldsToRemoveInRoute,
      jsonFieldsInRoute,
      yamlFieldsInRoute,
      "route"
    ) as unknown as RouteConf;
  }
  return null;
}

function normalize(
  node: BuilderRouteOrBrickNode,
  fieldsToRemove: string[],
  jsonFields: string[],
  yamlFields: string[],
  type: "brick" | "route"
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(node)
      // Remove unused fields from CMDB.
      // Consider fields started with `_` as unused.
      .filter(
        ([key, value]) =>
          !(
            key[0] === "_" ||
            fieldsToRemove.includes(key) ||
            ((value === false || value === null) &&
              disposableFalseOrNullFields.includes(key)) ||
            (value === null && disposableNullFields.includes(key)) ||
            (value === true && key === "injectDeep")
          )
      )
      // Parse specific fields.
      .map(([key, value]) => [
        key === "instanceId" ? "iid" : key,
        type === "route" && key === "segues"
          ? getCleanSegues(value as string)
          : jsonFields.includes(key)
          ? safeJsonParse(value as string)
          : yamlFields.includes(key)
          ? safeYamlParse(value as string)
          : cloneDeep(value),
      ])
  );
}

// Clear `segue._view` which is for development only.
function getCleanSegues(string: string): SeguesConf {
  const segues = safeJsonParse(string);
  return (
    segues &&
    Object.fromEntries(
      Object.entries(segues).map(([id, segue]) => [
        id,
        segue && {
          target: segue.target,
        },
      ])
    )
  );
}

function safeJsonParse(value: string): unknown {
  if (!value) {
    return;
  }
  try {
    return JSON.parse(value);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("JSON.parse() failed", value);
  }
}

function safeYamlParse(value: string): unknown {
  if (!value) {
    return;
  }
  try {
    const result = yaml.safeLoad(value, {
      schema: yaml.JSON_SCHEMA,
      json: true,
    });
    return result;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to parse yaml string", value);
  }
}
