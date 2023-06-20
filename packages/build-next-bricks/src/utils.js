import {
  isStringLiteral,
  isTSArrayType,
  isTSIndexedAccessType,
  isTSIntersectionType,
  isTSLiteralType,
  isTSPropertySignature,
  isTSQualifiedName,
  isTSTupleType,
  isTSTypeAnnotation,
  isTSTypeLiteral,
  isTSTypeReference,
  isTSUnionType,
} from "@babel/types";
import _ from "lodash";

export const BASE_TYPE = {
  any: "any",
  boolean: "boolean",
  undefined: "undefined",
  bigint: "bigint",
  null: "null",
  number: "number",
  object: "object",
  string: "string",
};

export const TS_KEYWORD_LIST = ["Record", "Array", "unknow", "void"];
const TS_BASIC_TYPE = {
  TSAnyKeyword: BASE_TYPE.any,
  TSBooleanKeyword: BASE_TYPE.boolean,
  TSBigIntKeyword: BASE_TYPE.bigint,
  TSNullKeyword: BASE_TYPE.null,
  TSNumberKeyword: BASE_TYPE.number,
  TSObjectKeyword: BASE_TYPE.object,
  TSStringKeyword: BASE_TYPE.string,
  TSUndefinedKeyword: BASE_TYPE.undefined,
  TSUnknownKeyword: BASE_TYPE.any,
};

function getTSBasicType(annotation) {
  return TS_BASIC_TYPE[annotation.type];
}

/**
 *
 * @param {import("@babel/types").typeAnnotation} typeAnnotation
 * @param {string} source
 * @param {Set<string>} reference
 * @returns
 */
export const getTypeAnnotation = (
  typeAnnotation,
  source,
  reference = new Set()
) => {
  if (isTSTypeAnnotation(typeAnnotation)) {
    return getTypeAnnotation(typeAnnotation.typeAnnotation, source, reference);
  } else if (isTSTypeReference(typeAnnotation)) {
    const { typeName, typeParameters } = typeAnnotation;
    if (isTSQualifiedName(typeName)) {
      return {
        type: "reference",
        left: typeName.left.name,
        right: typeName.right.name,
      };
    }
    const name = typeName.name;
    reference.add(name);
    const params =
      typeParameters?.params &&
      typeParameters.params.map((item) =>
        getTypeAnnotation(item, source, reference)
      );
    return {
      type: "reference",
      name: name,
      params: params,
    };
  } else if (isTSUnionType(typeAnnotation)) {
    return {
      type: "union",
      types: typeAnnotation.types.map((item) =>
        getTypeAnnotation(item, source, reference)
      ),
    };
  } else if (isTSArrayType(typeAnnotation)) {
    return {
      type: "array",
      elementType: getTypeAnnotation(
        typeAnnotation.elementType,
        source,
        reference
      ),
    };
  } else if (isTSTupleType(typeAnnotation)) {
    return {
      type: "tuple",
      elementTypes: typeAnnotation.elementTypes.map((item) =>
        getTypeAnnotation(item, source, reference)
      ),
    };
  } else if (isTSIntersectionType(typeAnnotation)) {
    return {
      type: "intersection",
      types: typeAnnotation.types.map((item) =>
        getTypeAnnotation(item, source, reference)
      ),
    };
  } else if (isTSTypeLiteral(typeAnnotation)) {
    return {
      type: "typeLiteral",
      members: typeAnnotation.members.map((item) =>
        getTypeAnnotation(item, source, reference)
      ),
    };
  } else if (isTSPropertySignature(typeAnnotation)) {
    return {
      type: "propertySignature",
      name: typeAnnotation.key.name,
      properties: getTypeAnnotation(typeAnnotation.typeAnnotation),
    };
  } else if (isTSIndexedAccessType(typeAnnotation)) {
    return {
      type: "indexedAccess",
      objectType: getTypeAnnotation(
        typeAnnotation.objectType,
        source,
        reference
      ),
      indexType: getTypeAnnotation(typeAnnotation.indexType, source, reference),
    };
  } else if (isTSLiteralType(typeAnnotation)) {
    let value;
    if (isStringLiteral(typeAnnotation.literal)) {
      value = `"${typeAnnotation.literal.value}"`;
    }
    value = typeAnnotation.literal.value;
    return {
      type: "literal",
      value,
    };
  } else if (getTSBasicType(typeAnnotation)) {
    return {
      type: "stringLiteral",
      value: getTSBasicType(typeAnnotation),
    };
  }
};

/**
 * @param {import("@babel/types").TSTypeElement} element
 * @param string source
 * @returns string
 */
export const getKeyName = (element, source) => {
  if (element.key) {
    return element.key.name;
  } else if (element.parameters) {
    const { start, end } = element.parameters[0];
    return source.substring(start, end);
  }
};
