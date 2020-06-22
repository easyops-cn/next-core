const fs = require("fs");
const path = require("path");
const TypeDoc = require("typedoc");
const { get } = require("lodash");

const brickKindMap = {
  property: "properties",
  event: "events",
  method: "methods",
};
const extraScanPaths = ["src/interfaces"];

const supportedDecorators = ["property", "event", "method"];
const methodComments = ["params", "description"];
const eventDocComments = ["detail", "description"];
const propertyDocComments = [
  "name",
  "kind",
  "required",
  "default",
  "description",
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
];

function generateBrickDoc(doc, scope) {
  const { name, children = [] } = doc;
  const brickDocs = [];
  traverseModules(children, brickDocs);

  return {
    module: name,
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

      prev[curr.tag] = curr.text.trim();
    }

    return prev;
  }, {});
}

function composeBrickDocProperties(brick) {
  const { name, comment } = brick;
  return {
    name,
    ...convertTagsToMapByFields(get(comment, "tags", []), propertyDocComments),
  };
}

function getEventTypeByDecorators(decorators) {
  const finder = decorators.find((d) => d.name === "event");
  if (finder) {
    // eslint-disable-next-line no-useless-escape
    const matcher = finder.arguments.options.match(/type\:\s\"([a-zA-Z\.]+)\"/);

    return matcher ? matcher[1] : null;
  }

  return null;
}

function composeBrickDocEvents(brick) {
  const { comment, decorators } = brick;

  return {
    type: getEventTypeByDecorators(decorators),
    ...convertTagsToMapByFields(get(comment, "tags", []), eventDocComments),
  };
}

function composeBrickDocMethods(brick) {
  const { name, comment } = brick;

  return {
    name,
    ...convertTagsToMapByFields(get(comment, "tags", []), methodComments),
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
    return null;
  }

  const finder = brick.decorators.find((d) =>
    supportedDecorators.includes(d.name)
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
  const finder = groups.filter(
    (group) => group.kind === 1024 || group.kind === 2048
  );
  if (finder.length === 0) return {};

  return finder
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

function extractRealInterfaceType(type, typeData) {
  switch (type) {
    case "reference":
      // eslint-disable-next-line no-case-declarations
      let result = "";
      if (typeData.name) {
        result += typeData.name;
      }

      if (typeData.typeArguments && typeData.typeArguments.length > 0) {
        result += `<${typeData.typeArguments
          .map((type) => extractRealInterfaceType(type.type, type))
          .join(", ")}>`;
      }

      return result;
    case "array":
      return `${extractRealInterfaceType(
        typeData.elementType.type,
        typeData.elementType
      )}[]`;
    case "union":
      return typeData.types
        .map((type) => extractRealInterfaceType(type.type, type))
        .join(" | ");
    case "stringLiteral":
      return `"${typeData.value}"`;
    case "intrinsic":
    case "typeParameter":
      return typeData.name;
    case "intersection":
      return typeData.types
        .map((type) => extractRealInterfaceType(type.type, type))
        .join(" & ");
    case "reflection":
      return "object";
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
    type: extractRealInterfaceType(type.type.type, type.type),
  };
}

function extractBrickDocEnumerations(enumerations) {
  return {
    name: enumerations.name,
    typeParameter: null,
    kind: "enum",
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
            children: [
              ...finder.children.map((child) => {
                return {
                  name: child.name,
                  type: extractRealInterfaceType(child.type.type, child.type),
                  required: !get(child, ["flags", "isOptional"], false),
                  description: get(child, ["comment", "shortText"], "").trim(),
                };
              }),
            ],
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
  references
) {
  element.children.forEach((child) => {
    traverseUsedReferenceIdsByType(child.type, usedReferenceIds, references);
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
    const classElement = module.children.find(
      (child) => child.id === elementId && existBrickDocId(child)
    );
    if (!classElement) return;
    const { comment, children, groups } = classElement;
    const references = [...module.children, ...extraInterfaceReferencesValues];
    traverseElementUsedInterfaceIds(classElement, usedReferenceIds, references);

    bricks.push({
      ...extractBrickDocBaseKind(comment.tags),
      ...extractBrickDocComplexKind(groups, children),
      ...extractBrickDocInterface(usedReferenceIds, references),
    });
    brickDocs.push(...bricks);
  });
}

function traverseUsedReferenceIdsByType(type, usedReferenceIds, references) {
  if (!type || !type.type) return;

  if (type.$$traversed) {
    return;
  }
  type.$$traversed = true;
  switch (type.type) {
    case "union":
    case "intersection":
      type.types.forEach((item) =>
        traverseUsedReferenceIdsByType(item, usedReferenceIds, references)
      );
      break;
    case "array":
      traverseUsedReferenceIdsByType(
        type.elementType,
        usedReferenceIds,
        references
      );
      break;
    case "reference":
      if (type.id) {
        usedReferenceIds.add(type.id);
        traverseUsedReferenceIdsByReflection(
          references.find((child) => child.id === type.id),
          usedReferenceIds,
          references
        );
      }
      if (type.typeArguments && type.typeArguments.length > 0) {
        type.typeArguments.forEach((item) =>
          traverseUsedReferenceIdsByType(item, usedReferenceIds, references)
        );
      }
      break;
    /* istanbul ignore next */
    case "indexedAccess":
      traverseUsedReferenceIdsByType(
        type.objectType,
        usedReferenceIds,
        references
      );
      break;
  }
}

function traverseUsedReferenceIdsByReflection(
  reflection,
  usedReferenceIds,
  references
) {
  if (!reflection) {
    return;
  }
  switch (reflection.kindString) {
    case "Interface":
      reflection.children
        .filter((item) => item.kindString === "Property")
        .forEach((item) =>
          traverseUsedReferenceIdsByType(
            item.type,
            usedReferenceIds,
            references
          )
        );
      break;
    case "Type alias":
      traverseUsedReferenceIdsByType(
        reflection.type,
        usedReferenceIds,
        references
      );
      break;
  }
}

function getElementIdByGroups(groups) {
  const elementClass = groups.find((group) => group.title === "Classes");

  return get(elementClass, "children[0]", null);
}

module.exports = function generateBrickDocs(packageName, scope) {
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
      const bricksDocJson = generateBrickDoc(typeDocJson, scope);
      if (fs.existsSync(docsJsonPath)) {
        fs.writeFile(
          docsJsonPath,
          JSON.stringify(bricksDocJson, null, 2),
          (err) => {
            if (err) throw err;
            console.log("Bricks docs written to doc.json.");
          }
        );
      }
      console.log(`Bricks docs for ${packageName} generated.`);
    } else {
      throw new Error(`Bricks docs for ${packageName} generate failed.`);
    }
  } else {
    throw new Error(`typedoc convert failed for ${packageName} `);
  }
};
