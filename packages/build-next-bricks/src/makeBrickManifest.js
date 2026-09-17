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
    parts: [],
    types: {
      properties: [],
      events: [],
      methods: [],
    },
  };

  const docComment = findDocComment(nodePath, source);
  if (docComment) {
    manifest.description = toI18nDescription(
      getChineseText(docComment),
      findTag(docComment.tags, "en")?.description
    );
    manifest.deprecated = getDeprecatedInfo(docComment.tags);
    for (const tag of docComment.tags) {
      switch (tag.title) {
        case "slot": {
          const match = tag.description.match(/^(?:([-\w]+)\s+-\s+)?(.*)$/);
          if (!match) {
            throw new Error(
              `Doc comment for slot is invalid: '${tag.description}'`
            );
          }
          manifest.slots.push({
            name: match[1] ?? null,
            description: toI18nDescription(
              match[2],
              findI18nTag(docComment.tags, "slotEn", match[1] ?? null)
            ),
          });
          break;
        }
        case "part": {
          const match = tag.description.match(/^([-\w]+)\s+-\s+(.*)$/);
          if (!match) {
            throw new Error(
              `Doc comment for part is invalid: '${tag.description}'`
            );
          }
          manifest.parts.push({
            name: match[1],
            description: toI18nDescription(
              match[2],
              findI18nTag(docComment.tags, "partEn", match[1])
            ),
          });
          break;
        }
        case "category": {
          if (tag.description) {
            manifest.category = tag.description;
          }
          break;
        }
        // 主动声明原生事件，例如 eo-button 构件的 click 事件
        case "event": {
          const match = tag.description.match(/^([-\w]+)\s+-\s+(.*)$/);
          if (!match) {
            throw new Error(
              `Doc comment for event is invalid: '${tag.description}'`
            );
          }
          manifest.events.push({
            name: match[1],
            description: toI18nDescription(
              match[2],
              findI18nTag(docComment.tags, "eventEn", match[1])
            ),
          });
          break;
        }
        case "insider": {
          manifest.insider = true;
        }
      }
    }
  }

  manifest.types.usedReferences = scanFields(
    manifest,
    classPath.node.body.body,
    source
  );

  // 如果有默认插槽，代表有默认属性 textContent
  const hasDefaultSlot = manifest.slots.some((slot) => !slot.name);
  if (hasDefaultSlot) {
    manifest.properties.push({
      name: "textContent",
      type: "string",
      description: { zh: "文本内容", en: "Text content" },
    });
    manifest.types.properties.push({
      name: "textContent",
      annotation: {
        type: "keyword",
        value: "string",
      },
    });
  }

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
    manifest.description = toI18nDescription(
      getChineseText(docComment),
      findTag(docComment.tags, "en")?.description
    );
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
        description: toI18nDescription(
          docComment?.tags.find(
            (tag) => tag.title === "param" && tag.name === param.name
          )?.description,
          findParamEn(docComment, param.name)
        ),
        annotation,
      });
    } else {
      const paramTag = docComment?.tags.filter(
        (tag) => tag.title === "param"
      )?.[index];
      manifest.params.push({
        name: paramTag?.name ?? `param_${index + 1}`,
        description: toI18nDescription(
          paramTag?.description,
          findParamEn(docComment, paramTag?.name ?? `param_${index + 1}`)
        ),
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
                if (findTag(docComment.tags, "internal")) {
                  break;
                }
                prop.description = toI18nDescription(
                  getChineseText(docComment),
                  findTag(docComment.tags, "en")?.description
                );
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
                event.description = toI18nDescription(
                  getChineseText(docComment),
                  findTag(docComment.tags, "en")?.description
                );
                event.deprecated = getDeprecatedInfo(docComment.tags);
                const detailTag = findTag(docComment.tags, "detail");
                if (detailTag) {
                  event.detail ??= {};
                  event.detail.description = toI18nDescription(
                    detailTag.description,
                    findTag(docComment.tags, "detailEn")?.description
                  );
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
            method.description = toI18nDescription(
              getChineseText(docComment),
              findTag(docComment.tags, "en")?.description
            );
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
                description: toI18nDescription(
                  docComment?.tags.find(
                    (tag) => tag.title === "param" && tag.name === param.name
                  )?.description,
                  findParamEn(docComment, param.name)
                ),
                type: paramType,
              });
            } else {
              const paramTag = docComment?.tags.filter(
                (tag) => tag.title === "param"
              )?.[index];
              paramName = paramTag?.name ?? `param_${index + 1}`;
              method.params.push({
                name: paramName,
                description: toI18nDescription(
          paramTag?.description,
          findParamEn(docComment, paramTag?.name ?? `param_${index + 1}`)
        ),
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
 * @returns {undefined | { description?: string; deprecated?: boolean | string; default?: string; }}
 */
export function parseTypeComment(node, source) {
  const docComment = parseDocComment(node, source);
  if (docComment) {
    return {
      description: toI18nDescription(
        getChineseText(docComment),
        findTag(docComment.tags, "en")?.description
      ),
      deprecated: getDeprecatedInfo(docComment.tags),
      ...(node.type === "TSPropertySignature"
        ? {
            default: findTag(docComment.tags, "default")?.description,
          }
        : null),
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
 * 把中文说明与英文说明整理成 `{ zh, en }`；没有英文时返回原字符串（向后兼容）。
 * @param {string | undefined} zh
 * @param {string | undefined} en
 */
function toI18nDescription(zh, en) {
  return en ? { zh, en } : zh;
}

/**
 * 取中文说明。JSDoc 摘要为空时回退到 `@description` 标签。
 *
 * 部分 `eo-*` 构件把事件的中文写在 `@description` 标签里（而非 JSDoc 摘要），
 * 早期构建器只读摘要，导致这些事件的中文一直是空字符串。
 * @param {ReturnType<typeof parseDocComment>} docComment
 */
/**
 * 取 `@paramEn` 的英文说明。
 *
 * doctrine 只对内置的 `@param` 解析出 `name`，对 `@paramEn` 会把整段文本放进 description，
 * 所以这里自行按 `<名字> <说明>`（允许 `名字 - 说明`）拆分并匹配参数名。
 * @param {ReturnType<typeof parseDocComment>} docComment
 * @param {string} paramName
 */
function findParamEn(docComment, paramName) {
  for (const tag of docComment?.tags ?? []) {
    if (tag.title !== "paramEn" || !tag.description) {
      continue;
    }
    const match = tag.description.match(/^(\S+)\s+([\s\S]*)$/);
    if (!match || match[1] !== paramName) {
      continue;
    }
    return match[2].replace(/^\s*-\s*/, "");
  }
}

function getChineseText(docComment) {
  return (
    docComment.description ||
    findTag(docComment.tags, "description")?.description
  );
}

/**
 * 从同名的 `@slotEn` / `@partEn` / `@eventEn` 标签里取出英文说明。
 * 标签格式与中文标签一致：`<名称> - <英文说明>`。
 * @param {Tag[]} tags
 * @param {string} title
 * @param {string | null} name
 */
function findI18nTag(tags, title, name) {
  for (const tag of tags) {
    if (tag.title !== title || !tag.description) {
      continue;
    }
    // 无名标签（如 `@slot - 按钮内容`）直接取整段说明（去掉前导的 `- `）。
    if (name == null) {
      return tag.description.replace(/^\s*-\s*/, "");
    }
    const match = tag.description.match(/^([-\w]+)\s+-\s+(.*)$/);
    if (match && match[1] === name) {
      return match[2];
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
