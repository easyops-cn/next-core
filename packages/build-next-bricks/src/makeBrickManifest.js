import { parse } from "doctrine";

/**
 * @typedef {import("@next-core/brick-manifest").BrickManifest} BrickManifest
 * @typedef {import("@next-core/brick-manifest").PropertyManifest} PropertyManifest
 * @typedef {import("@next-core/brick-manifest").EventManifest} EventManifest
 * @typedef {import("@next-core/brick-manifest").MethodManifest} MethodManifest
 * @typedef {import("@next-core/brick-manifest").ProviderManifest} ProviderManifest
 * @typedef {import("@babel/types").Node} Node
 * @typedef {import("@babel/traverse").NodePath} NodePath
 * @typedef {import("@babel/types").ClassDeclaration} ClassDeclaration
 * @typedef {import("doctrine").Tag} Tag
 */

/**
 * @param {string} name
 * @param {NodePath} nodePath
 * @param {string} source
 * @returns {BrickManifest}
 */
export default function makeBrickManifest(name, nodePath, source) {
  /** @type {import("@babel/traverse").NodePath<ClassDeclaration>} */
  const classPath = nodePath.parentPath;
  /** @type {BrickManifest} */
  const manifest = {
    name,
    properties: [],
    events: [],
    slots: [],
    methods: [],
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

  scanFields(manifest, classPath.node.body.body, source);

  return manifest;
}

/**
 * @param {string} name
 * @param {NodePath} nodePath
 * @param {string} source
 * @returns {ProviderManifest}
 */
export function makeProviderManifest(name, nodePath, source) {
  /** @type {ProviderManifest} */
  const manifest = {
    name,
  };
  const docComment = findDocComment(nodePath, source);
  if (docComment) {
    manifest.description = docComment.description;
    manifest.deprecated = getDeprecatedInfo(docComment.tags);
  }
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
 * @param {BrickManifest} manifest
 * @param {Node[]} nodes
 * @param {string} source
 */
function scanFields(manifest, nodes, source) {
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
                name: node.key.name,
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
              const event = {};

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
                  `Invalid @event() call: no literal type option in event '${node.key.name}'`
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
            name: node.key.name,
            params: [],
          };
          const docComment = parseDocComment(node, source);
          if (docComment) {
            method.description = docComment.description;
            method.deprecated = getDeprecatedInfo(docComment.tags);
          }
          for (const param of node.params) {
            method.params.push(source.substring(param.start, param.end));
          }
          if (node.returnType && node.returnType.type === "TSTypeAnnotation") {
            const { typeAnnotation } = node.returnType;
            method.return ??= {};
            method.return.type = source.substring(
              typeAnnotation.start,
              typeAnnotation.end
            );
          }
          manifest.methods.push(method);
        }
      }
    }
  }
}

/**
 * @param {Node[]} nodes
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
