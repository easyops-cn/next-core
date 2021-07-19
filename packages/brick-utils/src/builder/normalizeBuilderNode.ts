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
} from "@next-core/brick-types";
import { isBrickNode, isRouteNode } from "./assertions";

const jsonFieldsInRoute = [
  "menu",
  "providers",
  "segues",
  "defineResolves",
  "redirect",
];

// Fields stored as yaml string will be parsed when build & push.
const yamlFieldsInRoute = ["permissionsPreCheck"];

const jsonFieldsInBrick = [
  "properties",
  "events",
  "lifeCycle",
  "params",
  "if",
  "transform",
  "transformFrom",
];

// Fields stored as yaml string will be parsed when build & push.
const yamlFieldsInBrick = ["permissionsPreCheck"];

// Fields started with `_` will be removed by default.
const fieldsToRemoveInRoute = [
  "appId",
  "children",
  "creator",
  "ctime",
  "id",
  "instanceId",
  "graphInfo",
  "modifier",
  "mountPoint",
  "mtime",
  "org",
  "parent",
  "sort",

  "deleteAuthorizers",
  "readAuthorizers",
  "updateAuthorizers",
];

const fieldsToRemoveInBrick = fieldsToRemoveInRoute.concat("type");

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
    return normalizeBuilderBrickNode(node);
  }
  if (isRouteNode(node)) {
    return normalizeBuilderRouteNode(node);
  }
  return null;
}

function normalizeBuilderBrickNode(node: BuilderBrickNode): BrickConf {
  return normalize(
    node,
    fieldsToRemoveInBrick,
    jsonFieldsInBrick,
    yamlFieldsInBrick
  ) as unknown as BrickConf;
}

function normalizeBuilderRouteNode(node: BuilderRouteNode): RouteConf {
  return normalize(
    node,
    fieldsToRemoveInRoute,
    jsonFieldsInRoute,
    yamlFieldsInRoute
  ) as unknown as RouteConf;
}

function normalize(
  node: BuilderRouteOrBrickNode,
  fieldsToRemove: string[],
  jsonFields: string[],
  yamlFields: string[]
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(node)
      // Remove unused fields from CMDB.
      // Consider fields started with `_` as unused.
      .filter(([key]) => key[0] !== "_" && !fieldsToRemove.includes(key))
      // Parse json fields.
      .map(([key, value]) => [
        key,
        jsonFields.includes(key)
          ? safeJsonParse(value as string)
          : yamlFields.includes(key)
          ? safeYamlParse(value as string)
          : cloneDeep(value),
      ])
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
