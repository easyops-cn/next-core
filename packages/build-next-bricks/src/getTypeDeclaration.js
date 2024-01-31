// @ts-check
import { parseTypeComment } from "./makeBrickManifest.js";

/** @typedef {import("@babel/types").Node} Node */
/** @typedef {import("@next-core/brick-manifest").Declaration} Declaration */
/** @typedef {import("@next-core/brick-manifest").Annotation} Annotation */
/** @typedef {import("@next-core/brick-manifest").AnnotationTypeParameterDeclaration} AnnotationTypeParameterDeclaration */
/** @typedef {import("@next-core/brick-manifest").AnnotationTypeParameterInstantiation} AnnotationTypeParameterInstantiation */
/** @typedef {import("@next-core/brick-manifest").AnnotationExpressionWithTypeArguments} AnnotationExpressionWithTypeArguments */
/** @typedef {import("@next-core/brick-manifest").AnnotationEnumMember} AnnotationEnumMember */
/** @typedef {import("@next-core/brick-manifest").AnnotationTypeParameter} AnnotationTypeParameter */
/** @typedef {import("@next-core/brick-manifest").AnnotationPropertySignature} AnnotationPropertySignature */

/**
 * @param {Node | null | undefined} node
 * @param {string} source
 * @param {Set<string>} usedReferences
 * @returns {Declaration | undefined}
 */
export default function getTypeDeclaration(node, source, usedReferences) {
  switch (node.type) {
    case "TSInterfaceDeclaration":
      // interface A { ... }
      return {
        type: "interface",
        name: node.id.name,
        typeParameters:
          /** @type {AnnotationTypeParameterDeclaration | undefined} */
          (getTypeAnnotation(node.typeParameters, source, usedReferences)),
        body: node.body.body.map(
          (item) =>
            /** @type {AnnotationPropertySignature} */
            (getTypeAnnotation(item, source, usedReferences))
        ),
        extends:
          /** @type {AnnotationExpressionWithTypeArguments[] | undefined} */
          (
            node.extends?.map((item) =>
              getTypeAnnotation(item, source, usedReferences)
            )
          ),
        ...parseTypeComment(node, source),
      };

    case "TSTypeAliasDeclaration":
      // type A = B
      return {
        type: "typeAlias",
        name: node.id.name,
        typeParameters:
          /** @type {AnnotationTypeParameterDeclaration | undefined} */
          (getTypeAnnotation(node.typeParameters, source, usedReferences)),
        annotation: getTypeAnnotation(
          node.typeAnnotation,
          source,
          usedReferences
        ),
        ...parseTypeComment(node, source),
      };

    case "TSEnumDeclaration":
      // enum A { ... }
      return {
        type: "enum",
        name: node.id.name,
        members:
          /** @type {AnnotationEnumMember[] | undefined} */
          (
            node.members.map((item) =>
              getTypeAnnotation(item, source, usedReferences)
            )
          ),
        ...parseTypeComment(node, source),
      };
  }
}

/**
 * @param {Node | null | undefined} entryNode
 * @param {string} source
 * @param {Set<string>} usedReferences
 * @returns {Annotation | undefined}
 */
export function getTypeAnnotation(entryNode, source, usedReferences) {
  /**
   * @param {Node | null | undefined} node
   * @param {Boolean =} isRef
   * @returns {Annotation | undefined}
   */
  function get(node, isRef) {
    if (!node) {
      return;
    }
    switch (node.type) {
      case "TSEnumMember":
        // enum A { b = "B", c = "C" }
        //          ^^^^^^^
        return {
          type: "enumMember",
          id: get(node.id),
          initializer: get(node.initializer),
        };

      case "TSTypeAnnotation":
        // let a: MyType
        //      ^^^^^^^^
        return get(node.typeAnnotation);

      case "TSTypeReference":
        // type A = B
        //          ^
        return {
          type: "reference",
          typeName: get(node.typeName, true),
          typeParameters:
            /** @type {AnnotationTypeParameterInstantiation | undefined} */
            (get(node.typeParameters)),
        };

      case "TSQualifiedName":
        // type A = B.C
        //          ^^^
        return {
          type: "qualifiedName",
          left: get(node.left, true),
          right: get(node.right),
        };

      case "TSUnionType":
        // type A = string | number
        //          ^^^^^^^^^^^^^^^
        return {
          type: "union",
          types: node.types.map((item) => get(item)),
        };

      case "TSArrayType":
        // type A = string[]
        //          ^^^^^^^^
        return {
          type: "array",
          elementType: get(node.elementType),
        };

      case "TSTupleType":
        // type A = [string, number]
        //          ^^^^^^^^^^^^^^^^
        return {
          type: "tuple",
          elementTypes: node.elementTypes.map((item) => get(item)),
        };

      case "TSNamedTupleMember":
        // type A = [x: number, y: number]
        //           ^^^^^^^^^
        return {
          type: "namedTupleMember",
          label: node.label.name,
          optional: node.optional,
          elementType: get(node.elementType),
        };

      case "TSIntersectionType":
        // type A = B & C
        //          ^^^^^
        return {
          type: "intersection",
          types: node.types.map((item) => get(item)),
        };

      case "TSTypeLiteral":
        // type A = { prop: number }
        //          ^^^^^^^^^^^^^^^^
        return {
          type: "typeLiteral",
          members: node.members.map((item) => get(item)),
        };

      case "TSPropertySignature":
        // interface A { prop: number }
        //               ^^^^^^^^^^^^
        return {
          type: "propertySignature",
          key: get(node.key),
          annotation: get(node.typeAnnotation),
          // initializer: get(node.initializer),
          optional: node.optional,
          computed: node.computed,
          readonly: node.readonly,
          kind: node.kind,
          ...parseTypeComment(node, source),
        };

      case "TSMethodSignature":
        // interface A { call(a: number): void }
        //               ^^^^^^^^^^^^^^^^^^^^^
        return {
          type: "methodSignature",
          key: get(node.key),
          typeParameters:
            /** @type {AnnotationTypeParameterDeclaration | undefined} */
            (get(node.typeParameters)),
          parameters: node.parameters.map((item) => get(item)),
          annotation: get(node.typeAnnotation),
          optional: node.optional,
          computed: node.computed,
          kind: node.kind,
          ...parseTypeComment(node, source),
        };

      case "TSIndexSignature":
        // interface A { [k: string]: number }
        //               ^^^^^^^^^^^^^^^^^^^
        return {
          type: "indexSignature",
          parameter: get(node.parameters[0]),
          annotation: get(node.typeAnnotation),
          ...parseTypeComment(node, source),
        };

      case "TSIndexedAccessType":
        // type A = B["C"]
        //          ^^^^^^
        return {
          type: "indexedAccess",
          objectType: get(node.objectType),
          indexType: get(node.indexType),
        };

      case "TSTypeParameterDeclaration":
        // interface A<T, P> {}
        //            ^^^^^^
        return {
          type: "typeParameterDeclaration",
          params:
            /** @type {AnnotationTypeParameter[]} */
            (node.params.map((item) => get(item))),
        };

      case "TSTypeParameterInstantiation":
        // type A = B<T, P>
        //           ^^^^^^
        return {
          type: "typeParameterInstantiation",
          params: node.params.map((item) => get(item)),
        };

      case "TSTypeParameter":
        // interface A<T extends string = "", P> {}
        //             ^^^^^^^^^^^^^^^^^^^^^
        return {
          type: "typeParameter",
          name: node.name,
          default: get(node.default),
          constraint: get(node.constraint),
        };

      case "TSLiteralType":
        return get(node.literal);

      case "TSTypeOperator":
        // type A = keyof B
        //          ^^^^^^^
        return {
          type: "typeOperator",
          operator: node.operator,
          annotation: get(node.typeAnnotation),
        };

      case "TSTypeQuery":
        // type A = typeof B<T>
        //          ^^^^^^^^^^^
        return {
          type: "typeQuery",
          exprName: get(node.exprName),
          typeParameters:
            /** @type {AnnotationTypeParameterInstantiation | undefined} */
            (get(node.typeParameters)),
        };

      case "TSExpressionWithTypeArguments":
        // interface A extends B<T>, C
        //                     ^^^^
        return {
          type: "expressionWithTypeArguments",
          expression: get(node.expression, true),
          typeParameters:
            /** @type {AnnotationTypeParameterInstantiation | undefined} */
            (get(node.typeParameters)),
        };

      case "Identifier":
        // interface A { call(a: number) => void }
        //                    ^^^^^^^^^
        if (isRef) {
          usedReferences.add(node.name);
        }
        return {
          type: "identifier",
          name: node.name,
          annotation: get(node.typeAnnotation),
        };

      case "RestElement":
        // interface A { call(a, ...rest: unknown[]) => void }
        //                       ^^^^^^^^^^^^^^^^^^
        return {
          type: "restElement",
          argument: get(node.argument),
          annotation: get(node.typeAnnotation),
        };

      case "TSFunctionType":
        // interface A { call: (a: number) => void }
        //                     ^^^^^^^^^^^^^^^^^^^
        return {
          type: "function",
          typeParameters:
            /** @type {AnnotationTypeParameterDeclaration | undefined} */
            (get(node.typeParameters)),
          parameters: node.parameters.map((item) => get(item)),
          annotation: get(node.typeAnnotation),
        };

      case "TSParenthesizedType":
        return {
          type: "parenthesizedType",
          annotation: get(node.typeAnnotation),
        };

      case "TSConditionalType":
        return {
          type: "conditionalType",
          checkType: get(node.checkType),
          extendsType: get(node.extendsType),
          trueType: get(node.trueType),
          falseType: get(node.falseType),
        };

      case "TSInferType":
        return {
          type: "inferType",
          typeParameter:
            /** @type {AnnotationTypeParameter | undefined} */
            (get(node.typeParameter)),
        };

      case "StringLiteral":
      case "NumericLiteral":
      case "BooleanLiteral":
        return {
          type: "jsLiteral",
          value: node.value,
        };

      case "NullLiteral":
        return {
          type: "jsLiteral",
          value: null,
        };

      // <!-- Keywords start
      case "TSAnyKeyword":
        return { type: "keyword", value: "any" };
      case "TSBooleanKeyword":
        return { type: "keyword", value: "boolean" };
      case "TSBigIntKeyword":
        return { type: "keyword", value: "bigint" };
      case "TSNullKeyword":
        return { type: "keyword", value: "null" };
      case "TSNumberKeyword":
        return { type: "keyword", value: "number" };
      case "TSObjectKeyword":
        return { type: "keyword", value: "object" };
      case "TSStringKeyword":
        return { type: "keyword", value: "string" };
      case "TSUndefinedKeyword":
        return { type: "keyword", value: "undefined" };
      case "TSUnknownKeyword":
        return { type: "keyword", value: "unknown" };
      case "TSVoidKeyword":
        return { type: "keyword", value: "void" };
      case "TSSymbolKeyword":
        return { type: "keyword", value: "symbol" };
      case "TSNeverKeyword":
        return { type: "keyword", value: "never" };
      // Keywords end -->

      default:
        return {
          type: "unsupported",
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          source: source.substring(node.start, node.end),
        };
    }
  }

  return get(entryNode);
}
