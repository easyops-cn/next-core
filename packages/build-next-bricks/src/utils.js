import {
  isIdentifier,
  isTSArrayType,
  isTSEnumDeclaration,
  isTSIndexSignature,
  isTSIndexedAccessType,
  isTSInterfaceDeclaration,
  isTSIntersectionType,
  isTSLiteralType,
  isTSPropertySignature,
  isTSQualifiedName,
  isTSTupleType,
  isTSTypeAliasDeclaration,
  isTSTypeAnnotation,
  isTSTypeLiteral,
  isTSTypeParameter,
  isTSTypeParameterDeclaration,
  isTSTypeReference,
  isTSUnionType,
} from "@babel/types";
import _ from "lodash";
import { parseDocComment } from "./makeBrickManifest.js";

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
  return annotation && TS_BASIC_TYPE[annotation.type];
}

const getDocComment = (typeAnnotation, source) => {
  return parseDocComment(typeAnnotation, source) || {};
};

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
  const makeResultWithDocComment = (result) => {
    return {
      ...result,
      ...getDocComment(typeAnnotation, source),
    };
  };
  /**
   * @param {import("@babel/types").typeAnnotation} typeAnnotation
   */
  const walkTypeAnnotation = (typeAnnotation) => {
    if (isTSInterfaceDeclaration(typeAnnotation)) {
      const {
        id,
        body,
        extends: extendsItems,
        typeParameters,
      } = typeAnnotation;
      if (!id) return;
      return makeResultWithDocComment({
        name: id.name,
        type: "interface",
        typeParameters: typeParameters && walkTypeAnnotation(typeParameters),
        annotation: body.body.map((item) => walkTypeAnnotation(item)),
        extends: extendsItems?.map((item) => item.expression.name),
        reference: [...reference],
      });
    } else if (isTSTypeAliasDeclaration(typeAnnotation)) {
      const { id, typeParameters } = typeAnnotation;
      return makeResultWithDocComment({
        name: id.name,
        type: "typeAlias",
        typeParameters: typeParameters && walkTypeAnnotation(typeParameters),
        annotation: walkTypeAnnotation(typeAnnotation.typeAnnotation),
        reference: [...reference],
      });
    } else if (isTSEnumDeclaration(typeAnnotation)) {
      const { id, members } = typeAnnotation;
      return makeResultWithDocComment({
        name: id.name,
        type: "enums",
        members: members?.map((item) => {
          const { id } = item;
          return {
            name: isIdentifier(id) ? id.name : id.value,
            ...getDocComment(item, source),
          };
        }),
        reference: [...reference],
      });
    } else if (isTSTypeAnnotation(typeAnnotation)) {
      return walkTypeAnnotation(typeAnnotation.typeAnnotation);
    } else if (isTSTypeReference(typeAnnotation)) {
      const { typeName, typeParameters } = typeAnnotation;
      const qualified = isTSQualifiedName(typeName)
        ? getTypeAnnotation(typeName)
        : undefined;
      const name = typeName.name;
      reference.add(name);
      const params =
        typeParameters?.params &&
        typeParameters.params.map((item) => walkTypeAnnotation(item));
      return makeResultWithDocComment({
        type: "reference",
        typeName: name,
        typeParameters: params,
        qualified,
      });
    } else if (isTSQualifiedName(typeAnnotation)) {
      const left = getTypeAnnotation(typeAnnotation.left);
      if (typeof left === "string") {
        reference.add(left);
      }
      return {
        type: "qualifiedName",
        left: left,
        right: getTypeAnnotation(typeAnnotation.right),
      };
    } else if (isTSUnionType(typeAnnotation)) {
      return makeResultWithDocComment({
        type: "union",
        types: typeAnnotation.types.map((item) => walkTypeAnnotation(item)),
      });
    } else if (isTSArrayType(typeAnnotation)) {
      return makeResultWithDocComment({
        type: "array",
        elementType: walkTypeAnnotation(typeAnnotation.elementType),
      });
    } else if (isTSTupleType(typeAnnotation)) {
      return makeResultWithDocComment({
        type: "tuple",
        elementTypes: typeAnnotation.elementTypes.map((item) =>
          walkTypeAnnotation(item)
        ),
      });
    } else if (isTSIntersectionType(typeAnnotation)) {
      return makeResultWithDocComment({
        type: "intersection",
        types: typeAnnotation.types.map((item) => walkTypeAnnotation(item)),
      });
    } else if (isTSTypeLiteral(typeAnnotation)) {
      return makeResultWithDocComment({
        type: "typeLiteral",
        members: typeAnnotation.members.map((item) => walkTypeAnnotation(item)),
      });
    } else if (isTSPropertySignature(typeAnnotation)) {
      return makeResultWithDocComment({
        type: "propertySignature",
        name: typeAnnotation.key.name,
        property: walkTypeAnnotation(typeAnnotation.typeAnnotation),
      });
    } else if (isTSIndexSignature(typeAnnotation)) {
      return makeResultWithDocComment({
        type: "indexSignature",
        parameters: {
          name: typeAnnotation.parameters[0].name,
          ...walkTypeAnnotation(typeAnnotation.parameters[0].typeAnnotation),
        },
        property: walkTypeAnnotation(typeAnnotation.typeAnnotation),
      });
    } else if (isTSIndexedAccessType(typeAnnotation)) {
      return makeResultWithDocComment({
        type: "indexedAccess",
        objectType: walkTypeAnnotation(typeAnnotation.objectType),
        indexType: walkTypeAnnotation(typeAnnotation.indexType),
      });
    } else if (isTSTypeParameterDeclaration(typeAnnotation)) {
      return makeResultWithDocComment({
        type: "typeParameterDeclaration",
        params: typeAnnotation.params.map((item) => walkTypeAnnotation(item)),
      });
    } else if (isTSTypeParameter(typeAnnotation)) {
      return makeResultWithDocComment({
        type: "typeParameter",
        value: typeAnnotation.name,
        default:
          typeAnnotation.default && walkTypeAnnotation(typeAnnotation.default),
      });
    } else if (isTSLiteralType(typeAnnotation)) {
      return makeResultWithDocComment({
        type: "literal",
        value: typeAnnotation.literal.value,
      });
    } else if (isIdentifier(typeAnnotation)) {
      return typeAnnotation.name;
    } else if (getTSBasicType(typeAnnotation)) {
      return makeResultWithDocComment({
        type: "stringLiteral",
        value: getTSBasicType(typeAnnotation),
      });
    }
  };

  return walkTypeAnnotation(typeAnnotation);
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
