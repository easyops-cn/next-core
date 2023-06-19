import {
  isIdentifier,
  isStringLiteral,
  isTSArrayType,
  isTSIntersectionType,
  isTSLiteralType,
  isTSTupleType,
  isTSTypeAnnotation,
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

const getAdvancedType = (annotation) => {
  return `${
    TS_BASIC_TYPE[
      _.get(
        annotation,
        isTSTupleType(annotation) ? "elementTypes.0.type" : "elementType.type"
      )
    ]
  }[]`;
};

function getTSBasicType(annotation) {
  const isArray = annotation.type === "TSArrayType";
  const isTuple = annotation.type === "TSTupleType";
  if (isTSLiteralType(annotation)) {
    if (isStringLiteral(annotation.literal)) {
      return `"${annotation.literal.value}"`;
    }
    return annotation.literal.value;
  }
  return isArray || isTuple
    ? getAdvancedType(annotation)
    : TS_BASIC_TYPE[annotation.type];
}

/**
 *
 * @param {import("@babel/types").typeAnnotation} typeAnnotation
 * @param {string} source
 * @param {Set<string>} reference
 * @returns string
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
    const name = typeName.name;
    if (isIdentifier(typeAnnotation)) {
      reference.add(name);
    }
    const params =
      typeParameters?.params &&
      typeParameters.params.map((item) =>
        getTypeAnnotation(item, source, reference)
      );
    return params ? `${name}<${params.join(",")}>` : name;
  } else if (isTSUnionType(typeAnnotation)) {
    return typeAnnotation.types
      .map((item) => getTypeAnnotation(item, source, reference))
      .join("|");
  } else if (isTSArrayType(typeAnnotation)) {
    return `${getTypeAnnotation(
      typeAnnotation.elementType,
      source,
      reference
    )}[]`;
  } else if (isTSTupleType(typeAnnotation)) {
    return `${typeAnnotation.elementTypes.map((item) =>
      getTypeAnnotation(item, source, reference)
    )}[]`;
  } else if (isTSIntersectionType(typeAnnotation)) {
    return `${typeAnnotation.types
      .map((item) => getTypeAnnotation(item, source, reference))
      .join("&")}`;
  } else if (getTSBasicType(typeAnnotation)) {
    return getTSBasicType(typeAnnotation);
  }
  return source.substring(typeAnnotation.start, typeAnnotation.end);
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
