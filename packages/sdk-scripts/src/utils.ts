import semver from "semver";
import { loadDefaultTypes } from "./loaders/loadDefaultTypes";
import {
  RefFieldDoc,
  NormalFieldDoc,
  ExtFieldSource,
  BaseDoc,
  TypeAndEnum
} from "./interface";
import { Api } from "./lib/Api";

const PRIMITIVE_TYPES = [
  "string",
  "number",
  "boolean",
  "Record<string, any>",
  "File",
  "any"
];
const aliasTypeMap = new Map([
  ["int", "number"],
  ["int64", "number"],
  ["float", "number"],
  ["bool", "boolean"],
  ["map", "Record<string, any>"],
  ["file", "File"],
  ["value", "any"]
]);

export function isPrimitiveType(type: string): boolean {
  return PRIMITIVE_TYPES.includes(type);
}

export function isPropertyType(type: string): boolean {
  return type.includes('["');
}

export function isModelType(type: string): boolean {
  return !isPrimitiveType(type) && type !== "object";
}

export function normalizeSemver(version: string | number): string {
  let result = version;
  if (!(typeof result === "string" && result.split(".").length >= 3)) {
    result = String(Number(result));
    if (result.includes(".")) {
      result += ".0";
    } else {
      result += ".0.0";
    }
  }
  return result;
}

export function expectDocVersion({
  _version_: version
}: {
  _version_: string | number;
}): void {
  if (!semver.satisfies(normalizeSemver(version), "2.0.0 - 2.2")) {
    throw new Error(
      `Contract version not compatible, expect \`2.0.0 - 2.2\` but given ${version}`
    );
  }
}

let defaultTypeMap: Map<string, TypeAndEnum> = null;
export function getRealType(
  doc: TypeAndEnum
): TypeAndEnum & { isArray: boolean } {
  if (defaultTypeMap === null) {
    defaultTypeMap = loadDefaultTypes();
  }
  let { type, enum: enumValues } = doc;
  const isArray = type.endsWith("[]");
  if (isArray) {
    type = type.substr(0, type.length - 2);
  }
  if (defaultTypeMap.has(type)) {
    const predefined = defaultTypeMap.get(type);
    type = predefined.type;
    enumValues = predefined.enum;
  }
  if (aliasTypeMap.has(type)) {
    type = aliasTypeMap.get(type);
  }
  return {
    type,
    enum: enumValues,
    isArray
  };
}

export function getTransformedUri(uri: string): string {
  return uri.replace(/:([^/]+)/g, (_m, p) => `\${${p}}`);
}

export function getParamsInUri(uri: string): string[] {
  const matches = uri.match(/:(?:[^/]+)/g);
  return matches ? matches.map(m => m.substr(1)) : [];
}

interface RefinedRequestDoc {
  requestParams?: BaseDoc;
  requestBody?: BaseDoc;
}

// See Proposal: https://git.easyops.local/snippets/13
// - Body/query may be a sub-field in `api.request`.
// - Params in uri are defined in `api.request`, we should remove them.
export function refineRequest(api: Api): RefinedRequestDoc {
  const result: RefinedRequestDoc = {};
  const { request } = api.doc;

  if (request) {
    let fields = request.fields;
    if (Array.isArray(fields)) {
      // Make a shallow copy.
      fields = fields.slice();
    }

    const extFields = api.doc.endpoint.ext_fields;
    if (Array.isArray(extFields)) {
      if (!Array.isArray(fields)) {
        throw new Error(
          "Expect `request.fields` to be array when set `ext_fields`"
        );
      }

      const requestParamsField = extFields.find(
        f => f.source === ExtFieldSource.query
      );
      if (requestParamsField !== undefined) {
        const indexOfParams = fields.findIndex(
          f => (f as NormalFieldDoc).name === requestParamsField.name
        );
        if (indexOfParams === -1) {
          throw new Error(
            `Expect \`request.fields\` contains one of \`ext_fields\` which name is '${requestParamsField.name}'`
          );
        }
        result.requestParams = fields[indexOfParams] as NormalFieldDoc;
        fields.splice(indexOfParams, 1);
      }

      const requestBodyField = extFields.find(
        f => f.source === ExtFieldSource.body
      );
      if (requestBodyField !== undefined) {
        const indexOfBody = fields.findIndex(
          f => (f as NormalFieldDoc).name === requestBodyField.name
        );
        if (indexOfBody === -1) {
          throw new Error(
            `Expect \`request.fields\` contains one of \`ext_fields\` which name is '${requestBodyField.name}'`
          );
        }
        result.requestBody = fields[indexOfBody] as NormalFieldDoc;
        fields.splice(indexOfBody, 1);
      }
    } else {
      const key = api.method.isComplex ? "requestBody" : "requestParams";
      if (Array.isArray(fields)) {
        const uriParams = getParamsInUri(api.doc.endpoint.uri);
        fields = fields.filter(
          f =>
            // Remove by ref or name.
            !uriParams.some(p =>
              (f as RefFieldDoc).ref
                ? (f as RefFieldDoc).ref.endsWith(`.${p}`)
                : (f as NormalFieldDoc).name === p
            )
        );
        if (fields.length > 0) {
          result[key] = {
            ...request,
            fields
          };
        }
      } else {
        result[key] = request;
      }
    }
  }

  return result;
}
