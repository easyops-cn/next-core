const fs = require("fs");
const path = require("path");
const rimraf = require("rimraf");
const TypeDoc = require("typedoc");
const { get, sortBy } = require("lodash");
const log = require("npmlog");
const brickKindMap = {
  property: "properties",
  event: "events",
  method: "methods",
};
const extraScanPaths = ["src/interfaces"];

const supportedDecoratorSet = new Set(["property", "event", "method"]);
const methodComments = ["params", "description", "deprecated"];
const eventDocComments = ["detail", "description", "deprecated"];
const propertyDocComments = [
  "name",
  "kind",
  "required",
  "default",
  "deprecated",
  "description",
  "group",
  "enums",
  "editor",
  "editorprops",
];
const baseDocComments = [
  "id",
  "name",
  "description",
  "author",
  "slots",
  "interface",
  "memo",
  "history",
  "dockind",
  "deprecated",
  "editor",
  "editorprops",
  "groupi18n",
];

function generateBrickDoc(doc) {
  const { children = [] } = doc;
  const brickDocs = [];
  traverseModules(children, brickDocs);

  return {
    module: path.basename(path.resolve(process.cwd())),
    children: brickDocs,
  };
}

function convertTagsToMapByFields(tags, fields) {
  return tags.reduce((prev, curr) => {
    if (fields.includes(curr.tag)) {
      if (curr.tag === "slots") {
        prev["slots"] = composeBrickDocSlots(curr.text);
        return prev;
      }
      if (curr.tag === "history") {
        prev["history"] = composeBrickDocHistory(curr.text);
        return prev;
      }
      // 由于在typedoc中@type为关键字，在注释中以@kind替代，所以在这里会将kind，转换回type
      if (curr.tag === "kind") {
        prev["type"] = curr.text;
        return prev;
      }

      if (curr.tag === "enums") {
        prev["enums"] = curr.text;
        return prev;
      }

      if (curr.tag === "editor") {
        prev["editor"] = curr.text;
        return prev;
      }

      // 如果有`@deprecated`注解，强制转换为true
      if (curr.tag === "deprecated") {
        prev[curr.tag] = true;
        return prev;
      }

      let specialField;
      // typedoc 读取到的 tag 都为小写，不是驼峰的形式，这里特殊处理下最终文档生成驼峰的形式
      if (
        (specialField = ["editorProps", "groupI18N"].find(
          (name) => name.toLowerCase() === curr.tag
        ))
      ) {
        try {
          prev[specialField] = JSON.parse(curr.text);
          return prev;
        } catch {
          const find = tags.find((item) => item.tag === "name");
          throw new Error(
            `${specialField} tag of ${
              find && find.text
            } \`JSON.parse()\` parse error`
          );
        }
      }

      prev[curr.tag] = curr.text.trim();
    }

    return prev;
  }, {});
}

function getClassChildType(child) {
  let type = child.type;

  // setter
  if (!type && child.kindString === "Accessor" && child.setSignature) {
    type = child.setSignature[0].parameters[0].type;
  }

  return type;
}

function composeBrickDocProperties(brick) {
  const { name, comment, flags, defaultValue } = brick;
  const type = getClassChildType(brick);

  return {
    name,
    type: extractRealInterfaceType(type),
    required: flags?.isOptional !== true,
    default: defaultValue,
    ...convertTagsToMapByFields(get(comment, "tags", []), propertyDocComments),
  };
}

function getEventTypeByDecorators(decorators) {
  const finder = decorators.find((d) => d.name === "event");
  if (finder) {
    // eslint-disable-next-line no-useless-escape
    const matcher = finder.arguments.options.match(/type\:\s\"([\w\_\-\.]+)\"/);

    return matcher ? matcher[1] : null;
  }

  return null;
}

function getDetailTypeByEventType(type) {
  if (type.name === "EventEmitter" && type.typeArguments?.length > 0) {
    const argument = type.typeArguments[0];
    return extractRealInterfaceType(argument);
  }
}

function composeBrickDocEvents(brick) {
  const { comment, decorators, type } = brick;

  return {
    type: getEventTypeByDecorators(decorators),
    detail: getDetailTypeByEventType(type),
    ...convertTagsToMapByFields(get(comment, "tags", []), eventDocComments),
  };
}

function composeBrickDocMethods(brick) {
  const { name, comment, signatures } = brick;
  const tags =
    get(comment, "tags", null) ||
    get(signatures, [0, "comment", "tags"], null) ||
    [];
  return {
    name,
    params: signatures[0].parameters
      ?.map(
        (parameter) =>
          `${parameter.name}${
            parameter.flags?.isOptional ? "?" : ""
          }: ${extractRealInterfaceType(parameter.type)}`
      )
      .join(", "),
    ...convertTagsToMapByFields(tags, methodComments),
  };
}

/**
 * slots字符串格式为 "items:子节点 content:内容",
 * 转换为 {"name": "items","description": "子节点"}
 */
function composeBrickDocSlots(slot) {
  if (!slot) return null;
  return slot
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((curr) => {
      const [name, description] = curr.split(":");
      return { name, description };
    });
}

function composeBrickDocHistory(history) {
  if (!history) return null;
  return history
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((curr) => {
      const [version, change] = curr.split(":");
      return { version, change };
    });
}

function extractBrickDocBaseKind(tags) {
  return convertTagsToMapByFields(tags, baseDocComments);
}

function getRealBrickDocCategory(brick) {
  if (!Object.prototype.hasOwnProperty.call(brick, "decorators")) {
    //当继承的属性来自于 node_module 时，相关的 @property decorators 已经被转成低版本的代码，typedoc 获取不到相关 decorators 信息，
    // 这里通过 comment tag 来标识是否使用了 @property, 以便继承的属性也能生成到文档的 property 类别中显示
    if (
      get(brick, "comment.tags", []).find((item) => item.tag === "property")
    ) {
      return "property";
    } else if (
      get(brick, "signatures[0].comment.tags", []).find(
        (item) => item.tag === "method"
      )
    ) {
      return "method";
    }

    return null;
  }

  const finder = brick.decorators.find((d) =>
    supportedDecoratorSet.has(d.name)
  );

  if (finder) {
    return finder.name;
  }

  return null;
}

const getComputedDocCategory = (category, brick) => {
  switch (category) {
    case "property":
      return composeBrickDocProperties(brick);
    case "event":
      return composeBrickDocEvents(brick);
    case "method":
      return composeBrickDocMethods(brick);
    default:
      return {};
  }
};

function extractBrickDocComplexKind(groups, elementChildren) {
  // 1024 equal to `Properties`
  // 2048 equal to `Methods`
  // 2097152 equal to `Object literals`
  const finder = groups.filter((group) =>
    [
      TypeDoc.ReflectionKind.Property,
      TypeDoc.ReflectionKind.Method,
      TypeDoc.ReflectionKind.ObjectLiteral,
      TypeDoc.ReflectionKind.Accessor,
    ].includes(group.kind)
  );
  if (finder.length === 0) return {};

  const brickConf = finder
    .map((find) => [...find.children])
    .flat()
    .reduce((prev, curr) => {
      const brick = elementChildren.find((e) => e.id === curr);
      if (!brick) {
        return prev;
      }

      const cate = getRealBrickDocCategory(brick);
      if (cate) {
        const brickDoc = getComputedDocCategory(cate, brick);
        const displayCate = brickKindMap[cate];
        const data = prev[displayCate];

        prev[displayCate] = data ? [...data, brickDoc] : [brickDoc];
      }

      return prev;
    }, {});

  // `Object literals` 类型也会放在 Properties 列表中， 放进去后再统一进行排序
  const propertiesList = brickConf[brickKindMap.property];
  return propertiesList
    ? {
        ...brickConf,
        [brickKindMap.property]: sortBy(propertiesList, (item) => {
          const find = elementChildren.find(
            (child) => child.name === item.name
          );
          return find && find.id;
        }),
      }
    : brickConf;
}

function existBrickDocId(element) {
  try {
    if (
      !Object.prototype.hasOwnProperty.call(element, "comment") ||
      !Object.prototype.hasOwnProperty.call(element.comment, "tags") ||
      !element.comment.tags.find((tag) => tag.tag === "id")
    ) {
      return false;
    }

    return true;
  } catch (e) {
    throw new Error("Brick doc `id` not found!");
  }
}

function wrapBracketByParentType(typeStr, parentType) {
  return parentType === "array" ||
    parentType === "union" ||
    parentType === "intersection"
    ? `(${typeStr})`
    : typeStr;
}

function extractRealInterfaceType(typeData, parentType) {
  switch (typeData?.type) {
    case "reference":
      // eslint-disable-next-line no-case-declarations
      let result = "";
      if (typeData.name) {
        result += typeData.name;
      }

      if (typeData.typeArguments && typeData.typeArguments.length > 0) {
        result += `<${typeData.typeArguments
          .map((type) => extractRealInterfaceType(type))
          .join(", ")}>`;
      }

      return result;
    case "array":
      return `${extractRealInterfaceType(
        typeData.elementType,
        typeData.type
      )}[]`;
    case "union":
      return wrapBracketByParentType(
        typeData.types
          .map((type) => extractRealInterfaceType(type, typeData.type))
          .join(" | "),
        parentType
      );
    case "stringLiteral":
      return `"${typeData.value}"`;
    case "intrinsic":
    case "typeParameter":
    case "unknown": // unknown 暂定是`type`中的数字类型,e.g: type t = 0 | 1 | 'string'
      return typeData.name;
    case "intersection":
      return wrapBracketByParentType(
        typeData.types
          .map((type) => extractRealInterfaceType(type, typeData.type))
          .join(" & "),
        parentType
      );
    case "reflection": {
      if (typeData.declaration) {
        const {
          signatures,
          children = [],
          indexSignature = [],
        } = typeData.declaration;

        if (signatures) {
          const { parameters, type } = signatures[0];
          const typeStr = `(${parameters
            ?.map(
              (parameter) =>
                `${parameter.name}${
                  parameter.flags?.isOptional ? "?" : ""
                }: ${extractRealInterfaceType(parameter.type)}`
            )
            .join(", ")}) => ${extractRealInterfaceType(type)}`;

          return wrapBracketByParentType(typeStr, parentType);
        } else {
          return `{ ${[
            ...children.map(
              (child) =>
                `${child.name}${
                  child.flags?.isOptional ? "?" : ""
                }: ${extractRealInterfaceType(child.type)}`
            ),
            ...indexSignature.map((item) => {
              const parameter = item.parameters[0];
              return `[${parameter.name}: ${extractRealInterfaceType(
                parameter.type.type,
                parameter.type
              )}]: ${extractRealInterfaceType(item.type)}`;
            }),
          ].join("; ")} }`;
        }
      } else {
        return "object";
      }
    }
    case "tuple":
      return `[${typeData.elements
        ?.map((element) => element.name)
        .join(", ")}]`;
    default:
      return "";
  }
}

function extractBrickDocTypes(type) {
  return {
    name: type.name,
    typeParameter: getTypeParameter(type),
    kind: "type",
    description: get(type, ["comment", "shortText"], "").trim(),
    type: extractRealInterfaceType(type.type),
  };
}

function extractBrickDocEnumerations(enumerations) {
  return {
    name: enumerations.name,
    typeParameter: null,
    kind: "enum",
    description: enumerations?.comment?.shortText?.trim(),
    children: [
      ...enumerations.children.map((child) => {
        return {
          name: child.name,
          value: get(child, ["defaultValue"], ""),
          description: get(child, ["comment", "shortText"], "").trim(),
        };
      }),
    ],
  };
}

function getTypeParameter(finder) {
  return (
    (Object.prototype.hasOwnProperty.call(finder, "typeParameter") &&
      Array.isArray(finder.typeParameter) &&
      "<" + finder.typeParameter.map((type) => type.name).join(", ") + ">") ||
    null
  );
}

function extractBrickDocInterface(typeIds, references) {
  if (!typeIds) {
    return {
      interface: null,
    };
  }
  return {
    interface: Array.from(typeIds)
      .map((id) => {
        const finder = references.find((child) => child.id === id);

        if (finder) {
          if (finder.kindString === "Type alias") {
            return extractBrickDocTypes(finder);
          }

          if (finder.kindString === "Enumeration") {
            return extractBrickDocEnumerations(finder);
          }

          return {
            name: finder.name,
            typeParameter: getTypeParameter(finder),
            kind: "interface",
            extendedTypes: finder.extendedTypes,
            description: finder?.comment?.shortText?.trim(),
            children:
              finder.children
                ?.filter((child) => !child.inheritedFrom)
                .map((child) => {
                  return {
                    name: child.name,
                    type: extractRealInterfaceType(child.type),
                    required: !get(child, ["flags", "isOptional"], false),
                    description: get(
                      child,
                      ["comment", "shortText"],
                      ""
                    ).trim(),
                  };
                }) || [],
            indexSignature:
              finder.indexSignature?.map((child) => {
                return {
                  name: child.name,
                  parameters: child.parameters.map((parameter) => ({
                    ...parameter,
                    type: extractRealInterfaceType(parameter.type),
                  })),
                  type: extractRealInterfaceType(child.type),
                  required: !get(child, ["flags", "isOptional"], false),
                };
              }) || [],
          };
        }

        return null;
      })
      .filter(Boolean),
  };
}

function isExtraScanPath(module) {
  return (
    extraScanPaths.some((dir) => module.name.includes(dir)) &&
    Array.isArray(module.children)
  );
}

function traverseReferences(doc, references) {
  if (Array.isArray(doc.children)) {
    for (const child of doc.children) {
      references.set(child.id, child);
      traverseReferences(child, references);
    }
  }
}

function traverseExtraInterfaceReferences(modules, References) {
  modules.forEach((module) => {
    if (!isExtraScanPath(module)) return;

    traverseReferences(module, References);
  });
}

function traverseElementUsedInterfaceIds(
  element,
  usedReferenceIds,
  references,
  traversedTypeSet
) {
  element.children.forEach((child) => {
    if (
      !child.decorators?.some((decorator) =>
        supportedDecoratorSet.has(decorator.name)
      )
    ) {
      return;
    }

    if (child.kindString === "Method") {
      child.signatures[0].parameters?.map((parameter) =>
        traverseUsedReferenceIdsByType(
          parameter.type,
          usedReferenceIds,
          references,
          traversedTypeSet
        )
      );
    } else {
      const type = getClassChildType(child);

      traverseUsedReferenceIdsByType(
        type,
        usedReferenceIds,
        references,
        traversedTypeSet
      );
    }
  });
}

function traverseModules(modules, brickDocs) {
  const extraInterfaceReferences = new Map();

  traverseExtraInterfaceReferences(modules, extraInterfaceReferences);

  const extraInterfaceReferencesValues = Array.from(
    extraInterfaceReferences.values()
  );
  modules.forEach((module) => {
    if (!module.children) return;
    const bricks = [];
    const elementId = getElementIdByGroups(module.groups);

    if (!elementId) return;

    const usedReferenceIds = new Set();
    const traversedTypeSet = new Set();
    const classElement = module.children.find(
      (child) => child.id === elementId && existBrickDocId(child)
    );
    if (!classElement) return;
    const { comment, children, groups } = classElement;
    const references = [...module.children, ...extraInterfaceReferencesValues];
    traverseElementUsedInterfaceIds(
      classElement,
      usedReferenceIds,
      references,
      traversedTypeSet
    );
    const brick = {
      ...extractBrickDocBaseKind(comment.tags),
      ...extractBrickDocComplexKind(groups, children),
      ...extractBrickDocInterface(usedReferenceIds, references),
    };
    bricks.push(brick);
    brickDocs.push(...bricks);
    log.heading = path.basename(path.resolve(process.cwd()));
    log.info("Doc generated:", "%j", brick.id);
  });
}

function traverseUsedReferenceIdsByType(
  type,
  usedReferenceIds,
  references,
  traversedTypeSet
) {
  if (!type || !type.type) return;

  if (traversedTypeSet.has(type)) {
    return;
  }

  traversedTypeSet.add(type);

  switch (type.type) {
    case "union":
    case "intersection":
      type.types.forEach((item) =>
        traverseUsedReferenceIdsByType(
          item,
          usedReferenceIds,
          references,
          traversedTypeSet
        )
      );
      break;
    case "array":
      traverseUsedReferenceIdsByType(
        type.elementType,
        usedReferenceIds,
        references,
        traversedTypeSet
      );
      break;
    case "reference":
      if (type.id) {
        usedReferenceIds.add(type.id);
        traverseUsedReferenceIdsByReflection(
          references.find((child) => child.id === type.id),
          usedReferenceIds,
          references,
          traversedTypeSet
        );
      }
      if (type.typeArguments && type.typeArguments.length > 0) {
        type.typeArguments.forEach((item) =>
          traverseUsedReferenceIdsByType(
            item,
            usedReferenceIds,
            references,
            traversedTypeSet
          )
        );
      }
      break;
    /* istanbul ignore next */
    case "indexedAccess":
      traverseUsedReferenceIdsByType(
        type.objectType,
        usedReferenceIds,
        references,
        traversedTypeSet
      );
      break;
    case "reflection":
      if (type.declaration) {
        const { signatures, children, indexSignature } = type.declaration;

        signatures?.forEach((signature) => {
          signature.parameters?.forEach((parameter) =>
            traverseUsedReferenceIdsByType(
              parameter.type,
              usedReferenceIds,
              references,
              traversedTypeSet
            )
          );
          traverseUsedReferenceIdsByType(
            signature.type,
            usedReferenceIds,
            references,
            traversedTypeSet
          );
        });
        children?.forEach((child) => {
          traverseUsedReferenceIdsByType(
            child.type,
            usedReferenceIds,
            references,
            traversedTypeSet
          );
        });
        indexSignature?.forEach((item) => {
          traverseUsedReferenceIdsByType(
            item.type,
            usedReferenceIds,
            references,
            traversedTypeSet
          );
        });
      }
      break;
    case "tuple":
      type.elements?.forEach((element) =>
        traverseUsedReferenceIdsByType(
          element,
          usedReferenceIds,
          references,
          traversedTypeSet
        )
      );
      break;
  }
}

function traverseUsedReferenceIdsByReflection(
  reflection,
  usedReferenceIds,
  references,
  traversedTypeSet
) {
  if (!reflection) {
    return;
  }
  switch (reflection.kindString) {
    case "Interface":
      reflection.extendedTypes?.forEach((type) =>
        traverseUsedReferenceIdsByType(
          type,
          usedReferenceIds,
          references,
          traversedTypeSet
        )
      );
      reflection.children
        ?.filter((item) => item.kindString === "Property")
        .forEach((item) =>
          traverseUsedReferenceIdsByType(
            item.type,
            usedReferenceIds,
            references,
            traversedTypeSet
          )
        );
      reflection.indexSignature
        ?.filter((item) => item.kindString === "Index signature")
        .forEach((item) =>
          traverseUsedReferenceIdsByType(
            item.type,
            usedReferenceIds,
            references,
            traversedTypeSet
          )
        );
      break;
    case "Type alias":
      traverseUsedReferenceIdsByType(
        reflection.type,
        usedReferenceIds,
        references,
        traversedTypeSet
      );
      break;
  }
}

function getElementIdByGroups(groups) {
  const elementClass = groups.find((group) => group.title === "Classes");

  return get(elementClass, "children[0]", null);
}

function generateBrickBook(docsJson) {
  if (!docsJson) return;

  const distPath = path.join(process.cwd(), "dist");
  const { stories } = require(path.resolve(distPath, "stories"));

  const storiesPath = path.join(distPath, "stories.json");
  const docsPath = path.join(distPath, "docs.json");

  rimraf.sync(path.join(distPath, "stories"));
  rimraf.sync(docsPath);

  stories.forEach((story) => {
    const finder = docsJson.children.find((doc) => doc.id === story.storyId);
    if (finder) {
      story.doc = finder;
      if (Object.prototype.hasOwnProperty.call(finder, "deprecated")) {
        story.deprecated = true;
      }
      return;
    }
    story.doc = null;
  });

  fs.writeFileSync(storiesPath, JSON.stringify(stories, null, 2), {
    encoding: "utf-8",
  });
  console.log("Brick book written to stories.json.");
}

module.exports = function generateBrickDocs(packageName) {
  const app = new TypeDoc.Application();

  app.bootstrap({
    // tsconfig
    noImplicitAny: false,
    allowUnreachableCode: true,
    allowUnusedLabels: true,
    module: "ESNext",
    target: "ESNext",
    moduleResolution: "node",
    skipLibCheck: true,
    esModuleInterop: true,
    experimentalDecorators: true,
    jsx: "react",
    allowJs: true,
    allowSyntheticDefaultImports: true,
    emitDecoratorMetadata: true,
    emitDeclarationOnly: true,
    declaration: false,
    importHelpers: true,
    resolveJsonModule: true,
    strict: false,
    strictNullChecks: false,
    suppressExcessPropertyErrors: true,
    suppressImplicitAnyIndexErrors: true,

    // typedoc config
    out: "./docs",
    mode: "modules",
    excludeExternals: true,
    excludeNotExported: true,
    excludePrivate: true,
    excludeProtected: true,
    includeDeclarations: true,
    // disableSources: true,
    hideGenerator: true,
    categoryOrder: ["property", "event", "method", "Other"],
    exclude: [
      "node_modules",
      "**/*.spec.ts?(x)",
      "dist/",
      "**/__mocks__/",
      "**!/!(index).ts",
      "**/src/**/!(index).tsx",
      "**/i18n/",
      "**/data-providers/",
      "**/components/",
    ],
  });

  const project = app.convert(
    app.expandInputFiles([
      `${path.resolve(process.cwd(), "..", "..", "declarations")}`,
      `${process.cwd()}/src`,
    ])
  );
  if (project) {
    const docsJsonPath = path.resolve(process.cwd(), "./dist/docs.json");

    // app.generateDocs(project, "docs")
    const json = app.generateJson(project, "dist/docs.json");
    if (json) {
      const typeDocJson = require(path.resolve(docsJsonPath));
      const bricksDocJson = generateBrickDoc(typeDocJson);
      if (fs.existsSync(docsJsonPath)) {
        // 如果构建包内有`stories`文件夹，默认生成构建demo和doc
        if (fs.existsSync(path.join(process.cwd(), "dist", "stories"))) {
          console.log("Generating brick book..");
          generateBrickBook(bricksDocJson);
          console.log(`Brick books for ${packageName} generated.`);
        } else {
          console.log("Generating brick docs..");
          fs.writeFileSync(
            docsJsonPath,
            JSON.stringify(bricksDocJson, null, 2)
          );
          console.log(`Bricks docs for ${packageName} generated.`);
        }
      }
    } else {
      throw new Error(`Bricks docs for ${packageName} generate failed.`);
    }
  } else {
    throw new Error(`typedoc convert failed for ${packageName} `);
  }
};
