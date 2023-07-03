// @ts-check
import { parse } from "doctrine";
import { getTypeAnnotation } from "./getTypeDeclaration.js";

/**
 * @typedef {import("@next-core/brick-manifest").BrickManifest} BrickManifest
 * @typedef {import("@next-core/brick-manifest").PropertyManifest} PropertyManifest
 * @typedef {import("@next-core/brick-manifest").EventManifest} EventManifest
 * @typedef {import("@next-core/brick-manifest").MethodManifest} MethodManifest
 * @typedef {import("@next-core/brick-manifest").MethodParamManifest} MethodParamManifest
 * @typedef {import("@next-core/brick-manifest").ProviderManifest} ProviderManifest
 * @typedef {import("@next-core/brick-manifest").Annotation} Annotation
 * @typedef {import("@babel/types").Node} Node
 * @typedef {import("@babel/traverse").NodePath} NodePath
 * @typedef {import("@babel/types").ClassDeclaration} ClassDeclaration
 * @typedef {import("@babel/types").Identifier} Identifier
 * @typedef {import("doctrine").Tag} Tag
 * @typedef {BrickManifest & { types: BrickTypes; }} BrickManifestAndTypes
 * @typedef {{ name: string; annotation?: Annotation }} BrickPropertyWithAnnotation
 * @typedef {{ name: string; detail: { annotation: Annotation } }} BrickEventWithAnnotation
 * @typedef {{ name: string; params: BrickMethodParamWithAnnotation[]; returns: { annotation?: Annotation } }} BrickMethodWithAnnotation
 * @typedef {{ name: string; annotation?: Annotation }} BrickMethodParamWithAnnotation
 * @typedef {{
 *  properties: BrickPropertyWithAnnotation[];
 *  events: BrickEventWithAnnotation[];
 *  methods: BrickMethodWithAnnotation[];
 *  usedReferences?: Set<string>;
 * }} BrickTypes
 * @typedef {ProviderManifest & {
 *  params: (MethodParamManifest & {
 *    annotation?: Annotation;
 *  })[];
 *  returns?: {
 *    description?: string;
 *    annotation?: Annotation;
 *  };
 *  typeParameters?: Annotation;
 *  usedReferences?: Set<string>;
 * }} ProviderManifestAndTypes
 */

/**
 * @param {string} name
 * @param {string[] | undefined} alias
 * @param {NodePath} nodePath
 * @param {string} source
 * @returns {BrickManifestAndTypes}
 */
export default function makeBrickManifest(name, alias, nodePath, source) {
  const classPath =
    /** @type {import("@babel/traverse").NodePath<ClassDeclaration>} */ (
      nodePath.parentPath
    );
  /** @type {BrickManifestAndTypes} */
  const manifest = {
    name,
    alias,
    properties: [],
    events: [],
    slots: [],
    methods: [],
    types: {
      properties: [],
      events: [],
      methods: [],
    },
  };

  const docComment = findDocComment(nodePath, source);
  if (docComment) {
    manifest.description = docComment.description;
    manifest.deprecated = getDeprecatedInfo(docComment.tags);
    for (const tag of docComment.tags) {
      if (tag.title === "slot") {
        const match = tag.description.match(/^(?:([-\w]+)\s+-\s+)?(.*)$/);
        if (!match) {
          throw new Error(
            `Doc comment for slot is invalid: '${tag.description}'`
          );
        }
        manifest.slots.push({
          name: match[1] ?? null,
          description: match[2],
        });
      }
    }
  }

  manifest.types.usedReferences = scanFields(
    manifest,
    classPath.node.body.body,
    source
  );

  return manifest;
}

/**
 * @param {string} name
 * @param {NodePath} nodePath
 * @param {string} source
 * @returns {ProviderManifestAndTypes}
 */
export function makeProviderManifest(name, nodePath, source) {
  /**
   * @type {ProviderManifestAndTypes}
   */
  const manifest = {
    name,
    type: "provider",
    params: [],
    usedReferences: new Set(),
  };

  const docComment = findDocComment(nodePath, source);
  if (docComment) {
    manifest.description = docComment.description;
    manifest.deprecated = getDeprecatedInfo(docComment.tags);
  }

  const fn = /** @type {import("@babel/types").FunctionDeclaration} */ (
    nodePath.node
  );
  let index = 0;
  for (const param of fn.params) {
    const annotation = getTypeAnnotation(
      param.typeAnnotation,
      source,
      manifest.usedReferences
    );
    if (param.type === "Identifier") {
      manifest.params.push({
        name: param.name,
        description: docComment?.tags.find(
          (tag) => tag.title === "param" && tag.name === param.name
        )?.description,
        annotation,
      });
    } else {
      const paramTag = docComment?.tags.filter(
        (tag) => tag.title === "param"
      )?.[index];
      manifest.params.push({
        name: paramTag?.name ?? `param_${index + 1}`,
        description: paramTag?.description,
        isRestElement: param.type === "RestElement",
        annotation,
      });
    }
    index++;
  }
  const returnAnnotation = getTypeAnnotation(
    fn.returnType,
    source,
    manifest.usedReferences
  );

  manifest.returns = {
    description: docComment?.tags.find((tag) => tag.title === "returns")
      ?.description,
    annotation: returnAnnotation,
  };

  manifest.typeParameters = getTypeAnnotation(
    fn.typeParameters,
    source,
    manifest.usedReferences
  );

  return manifest;
}

/**
 * @param {NodePath} nodePath
 * @param {string} source
 */
function findDocComment({ node, parentPath }, source) {
  if (node.type !== "Program") {
    const docComment = parseDocComment(node, source);
    if (docComment) {
      return docComment;
    }
  }
  if (parentPath) {
    return findDocComment(parentPath, source);
  }
}

/**
 * @param {BrickManifestAndTypes} manifest
 * @param {Node[]} nodes
 * @param {string} source
 * @returns {Set<string>}
 */
function scanFields(manifest, nodes, source) {
  /** @type {Set<string>} */
  const usedReferences = new Set();
  for (const node of nodes) {
    if (node.type === "ClassAccessorProperty" && node.decorators?.length) {
      for (const { expression } of node.decorators) {
        if (
          expression.type === "CallExpression" &&
          expression.callee.type === "Identifier"
        ) {
          switch (expression.callee.name) {
            case "property": {
              /** @type {PropertyManifest} */
              const prop = {
                name: /** @type {Identifier} */ (node.key).name,
              };
              const docComment = parseDocComment(node, source);
              if (docComment) {
                prop.description = docComment.description;
                prop.required = getBooleanTag(docComment.tags, "required");
                prop.deprecated = getDeprecatedInfo(docComment.tags);
                prop.default = findTag(docComment.tags, "default")?.description;
              }
              // Find out the `attribute` option for the property.
              if (expression.arguments.length > 0) {
                const options = expression.arguments[0];
                if (options.type === "ObjectExpression") {
                  for (const opt of options.properties) {
                    if (
                      opt.type === "ObjectProperty" &&
                      !opt.computed &&
                      opt.key.type === "Identifier" &&
                      opt.key.name === "attribute"
                    ) {
                      if (
                        opt.value.type === "BooleanLiteral" ||
                        opt.value.type === "StringLiteral"
                      ) {
                        prop.attribute = opt.value.value;
                      }
                      break;
                    }
                  }
                }
              }
              // Find out the type annotation for the property.
              if (
                node.typeAnnotation &&
                node.typeAnnotation.type === "TSTypeAnnotation"
              ) {
                const { typeAnnotation } = node.typeAnnotation;
                prop.type = getTypeWithoutUndefined(typeAnnotation, source);

                const annotation = getTypeAnnotation(
                  getNodeWithoutUndefined(typeAnnotation),
                  source,
                  usedReferences
                );
                if (annotation) {
                  manifest.types.properties.push({
                    name: prop.name,
                    annotation,
                  });
                }
              } else if (node.value) {
                // Infer type annotation from the default value.
                let inferType;
                switch (node.value.type) {
                  case "BooleanLiteral":
                    inferType = "boolean";
                    break;
                  case "StringLiteral":
                    inferType = "string";
                    break;
                  case "NumericLiteral":
                    inferType = "number";
                    break;
                }
                if (inferType) {
                  manifest.types.properties.push({
                    name: prop.name,
                    annotation: {
                      type: "keyword",
                      value: inferType,
                    },
                  });
                }
              }
              if (node.value && !prop.default) {
                prop.default = source.substring(
                  node.value.start,
                  node.value.end
                );
              }
              manifest.properties.push(prop);
              break;
            }

            case "event": {
              /** @type {EventManifest} */
              const event = { name: undefined };

              // Find out the `type` option for the event.
              if (expression.arguments.length > 0) {
                const options = expression.arguments[0];
                if (options.type === "ObjectExpression") {
                  for (const opt of options.properties) {
                    if (
                      opt.type === "ObjectProperty" &&
                      !opt.computed &&
                      opt.key.type === "Identifier" &&
                      opt.key.name === "type"
                    ) {
                      if (opt.value.type === "StringLiteral") {
                        event.name = opt.value.value;
                      }
                      break;
                    }
                  }
                }
              }
              if (event.name === undefined) {
                throw new Error(
                  `Invalid @event() call: no literal type option in event '${
                    /** @type {Identifier} */ (node.key).name
                  }'`
                );
              }
              const docComment = parseDocComment(node, source);
              if (docComment) {
                event.description = docComment.description;
                event.deprecated = getDeprecatedInfo(docComment.tags);
                const detailTag = findTag(docComment.tags, "detail");
                if (detailTag) {
                  event.detail ??= {};
                  event.detail.description = detailTag.description;
                }
              }
              // Find out the type annotation for the event detail.
              if (
                node.typeAnnotation &&
                node.typeAnnotation.type === "TSTypeAnnotation"
              ) {
                const { typeAnnotation } = node.typeAnnotation;
                if (
                  typeAnnotation.type === "TSTypeReference" &&
                  typeAnnotation.typeName.type === "Identifier" &&
                  typeAnnotation.typeName.name === "EventEmitter"
                ) {
                  // Extract the parameters from `EventEmitter`
                  const param = typeAnnotation.typeParameters.params[0];
                  event.detail ??= {};
                  event.detail.type = source.substring(param.start, param.end);

                  const annotation = getTypeAnnotation(
                    param,
                    source,
                    usedReferences
                  );

                  if (annotation) {
                    manifest.types.events.push({
                      name: event.name,
                      detail: {
                        annotation,
                      },
                    });
                  }
                }
              }
              manifest.events.push(event);
              break;
            }
          }
        }
      }
    } else if (node.type === "ClassMethod" && node.decorators?.length) {
      for (const { expression } of node.decorators) {
        if (
          expression.type === "CallExpression" &&
          expression.callee.type === "Identifier" &&
          expression.callee.name === "method"
        ) {
          /** @type {MethodManifest} */
          const method = {
            name: /** @type {Identifier} */ (node.key).name,
            params: [],
          };
          const docComment = parseDocComment(node, source);
          if (docComment) {
            method.description = docComment.description;
            method.deprecated = getDeprecatedInfo(docComment.tags);
            method.returns = {
              description: docComment.tags.find(
                (tag) => tag.title === "returns"
              )?.description,
            };
          }

          let index = 0;
          /** @type {BrickMethodParamWithAnnotation[]} */
          const typedParams = [];
          for (const param of node.params) {
            const typeAnnotation =
              /** @type {Identifier} */
              (param).typeAnnotation;
            const annotation = getTypeAnnotation(
              typeAnnotation,
              source,
              usedReferences
            );
            const paramType =
              typeAnnotation.type === "TSTypeAnnotation"
                ? source.substring(
                    typeAnnotation.typeAnnotation.start,
                    typeAnnotation.typeAnnotation.end
                  )
                : undefined;
            /** @type {string} */
            let paramName;
            if (param.type === "Identifier") {
              paramName = param.name;
              method.params.push({
                name: paramName,
                description: docComment?.tags.find(
                  (tag) => tag.title === "param" && tag.name === param.name
                )?.description,
                type: paramType,
              });
            } else {
              const paramTag = docComment?.tags.filter(
                (tag) => tag.title === "param"
              )?.[index];
              paramName = paramTag?.name ?? `param_${index + 1}`;
              method.params.push({
                name: paramName,
                description: paramTag?.description,
                type: paramType,
              });
            }
            typedParams.push({
              name: paramName,
              annotation,
            });
            index++;
          }

          /** @type {{ annotation?: Annotation }} */
          const typedReturns = {};
          if (node.returnType && node.returnType.type === "TSTypeAnnotation") {
            const { typeAnnotation } = node.returnType;
            method.returns = {
              ...method.returns,
              type: source.substring(typeAnnotation.start, typeAnnotation.end),
            };

            typedReturns.annotation = getTypeAnnotation(
              typeAnnotation,
              source,
              usedReferences
            );
          }
          manifest.types.methods.push({
            name: method.name,
            params: typedParams,
            returns: typedReturns,
          });
          manifest.methods.push(method);
        }
      }
    }
  }

  return usedReferences;
}

/**
 * @param {Node} node
 * @param {string} source
 */
export function parseDocComment(node, source) {
  if (node.leadingComments) {
    const docComment = node.leadingComments.find(
      (comment) => comment.type === "CommentBlock"
    );
    if (docComment) {
      const docSource = source.substring(docComment.start, docComment.end);
      const parsed = parse(docSource, { unwrap: true });
      return parsed;
    }
  }
}

/**
 * @param {Node} node
 * @param {string} source
 * @returns {undefined | { description?: string; deprecated?: boolean | string; }}
 */
export function parseTypeComment(node, source) {
  const docComment = parseDocComment(node, source);
  if (docComment) {
    return {
      description: docComment.description,
      deprecated: getDeprecatedInfo(docComment.tags),
    };
  }
}

/**
 * @param {Node} node
 * @param {string} source
 */
function getTypeWithoutUndefined(node, source) {
  if (node.type === "TSUnionType") {
    const filteredTypes = node.types.filter(
      (type) => type.type !== "TSUndefinedKeyword"
    );
    if (filteredTypes.length < node.types.length) {
      return filteredTypes
        .map((type) => source.substring(type.start, type.end))
        .join(" | ");
    }
  }
  return source.substring(node.start, node.end);
}

/**
 * @param {Node} node
 * @returns {Node}
 */
function getNodeWithoutUndefined(node) {
  if (node.type === "TSUnionType") {
    const filteredTypes = node.types.filter(
      (type) => type.type !== "TSUndefinedKeyword"
    );
    if (filteredTypes.length < node.types.length) {
      if (filteredTypes.length === 1) {
        return filteredTypes[0];
      }
      return {
        ...node,
        types: filteredTypes,
      };
    }
  }
  return node;
}

/**
 * @param {Tag[]} tags
 * @param {string} title
 * @returns {Tag | undefined}
 */
function findTag(tags, title) {
  for (const tag of tags) {
    if (tag.title === title) {
      return tag;
    }
  }
}

/**
 * @param {Tag[]} tags
 * @param {string} title
 * @returns {boolean | undefined}
 */
function getBooleanTag(tags, title) {
  const tag = findTag(tags, title);
  return tag ? true : undefined;
}

/**
 * @param {Tag[]} tags
 * @returns {boolean | string | undefined}
 */
function getDeprecatedInfo(tags) {
  const tag = findTag(tags, "deprecated");
  return tag ? (tag.description === null ? true : tag.description) : undefined;
}
