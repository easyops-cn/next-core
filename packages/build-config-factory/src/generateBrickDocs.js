const fs = require("fs");
const path = require("path");
const TypeDoc = require("typedoc");
const { get } = require("lodash");

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
  const builtInProperties = [
    "name",
    "kind",
    "required",
    "default",
    "description",
  ];
  return {
    name,
    ...convertTagsToMapByFields(comment.tags, builtInProperties),
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
  const builtInEvents = ["detail", "description"];

  return {
    type: getEventTypeByDecorators(decorators),
    ...convertTagsToMapByFields(comment.tags, builtInEvents),
  };
}

function composeBrickDocMethods(brick) {
  const { name, comment } = brick;
  const builtInEvents = ["prams", "description"];

  return {
    name,
    ...convertTagsToMapByFields(comment.tags, builtInEvents),
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
  const kind = [
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
  return convertTagsToMapByFields(tags, kind);
}

function getRealBrickDocCategory(brick) {
  if (!Object.prototype.hasOwnProperty.call(brick, "decorators")) {
    return null;
  }

  const finder = brick.decorators.find((d) =>
    ["property", "event", "method"].includes(d.name)
  );

  if (finder) {
    return finder.name;
  }

  return null;
}

const brickKindMap = {
  property: "properties",
  event: "events",
  method: "methods",
};

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

function extractBrickDocInterface(typeIds, moduleChildren) {
  if (!typeIds) {
    return {
      interface: null,
    };
  }
  return {
    interface: typeIds
      .map((id) => {
        const finder = moduleChildren.find((child) => child.id === id);

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

function traverseModules(modules, brickDocs) {
  modules.forEach((module) => {
    if (!module.children) return;
    const bricks = [];
    const docGroups = getBrickGroups(module.groups);

    const elementId = docGroups.get("class");
    if (!Array.isArray(elementId)) return;

    const classElement = module.children.find(
      (child) => child.id === elementId[0] && existBrickDocId(child)
    );
    if (!classElement) return;
    const { comment, children, groups } = classElement;

    const interfaceIds = docGroups.get("interfaces");

    bricks.push({
      ...extractBrickDocBaseKind(comment.tags),
      ...extractBrickDocComplexKind(groups, children),
      ...extractBrickDocInterface(interfaceIds, module.children),
    });

    brickDocs.push(...bricks);
  });
}

function getBrickGroups(groups) {
  const map = new Map();
  const isHasClassElement = !!groups.find((group) => group.title === "Classes");
  if (!isHasClassElement) return map;

  groups.forEach((group) => {
    if (!Array.isArray(group.children) && group.children.length === 0) {
      return;
    }
    if (group.title === "Classes") {
      map.set("class", [...group.children]);
      return;
    }

    //  `Interface`, `Type`, `Enume`
    if (
      group.title === "Interfaces" ||
      group.title === "Type aliases" ||
      group.title === "Enumerations"
    ) {
      const interfaces = map.get("interfaces");
      if (interfaces) {
        map.set("interfaces", [...interfaces, ...group.children]);
      } else {
        map.set("interfaces", [...group.children]);
      }
    }
  });

  return map;
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
