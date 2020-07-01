const fs = require("fs");
const path = require("path");
const TypeDoc = require("typedoc");

function generateBrickDoc(doc, scope) {
  const { name, children } = doc;
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
      if (curr.tag === "slot") {
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

      prev[curr.tag] = curr.text;
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

function composeBrickDocEvents(brick) {
  // event的event name在@name注解里面，故不取property name
  const { comment } = brick;
  const builtInEvents = ["name", "detail", "description"];

  return convertTagsToMapByFields(comment.tags, builtInEvents);
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
 * slot字符串格式为 "items:子节点 content:内容",
 * 转换为 {"name": "items","description": "子节点"}
 */
function composeBrickDocSlots(slot) {
  if (!slot) return null;
  return slot
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
    "slot",
    "interface",
    "memo",
    "history",
    "dockind",
  ];
  return convertTagsToMapByFields(tags, kind);
}

function extractBrickDocComplexKind(groups, elementChildren) {
  const brickKindMap = {
    property: "properties",
    event: "events",
    method: "methods",
  };
  // 1024 equal to `Properties`
  // 2048 equal to `Methods`
  const finder = groups.filter(
    (group) => group.kind === 1024 || group.kind === 2048
  );
  if (finder.length === 0) return {};
  const complex = {};
  finder.forEach((find) => {
    find.categories.forEach((prev) => {
      const { title, children } = prev;
      const kind = brickKindMap[title];
      if (!kind) return;
      complex[kind] = children.map((id) => {
        const brick = elementChildren.find((e) => e.id === id);
        if (!brick) return {};
        switch (title) {
          case "property":
            return composeBrickDocProperties(brick);
          case "event":
            return composeBrickDocEvents(brick);
          case "method":
            return composeBrickDocMethods(brick);
          default:
            return {};
        }
      });

      // return prev
    });
  });

  return complex;
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

function traverseModules(modules, brickDocs) {
  modules.forEach((module) => {
    if (!module.children) return;
    const bricks = [];
    module.children.forEach((element) => {
      // 128 equal to `Class`
      if (element.kind !== 128 || !existBrickDocId(element)) return;
      const { comment, children, groups } = element;
      bricks.push({
        ...extractBrickDocBaseKind(comment.tags),
        ...extractBrickDocComplexKind(groups, children),
      });
    });

    brickDocs.push(...bricks);
  });
}

module.exports = function generateBrickDocs(packageName, scope) {
  const app = new TypeDoc.Application();
  // const providersJson = require(path.resolve("providers.json"));
  //  app.options.addReader(new TypeDoc.TSConfigReader());

  //  console.log(path.resolve(__dirname, "tsconfig.json"))
  app.bootstrap({
    noImplicitAny: false,
    allowUnreachableCode: true,
    allowUnusedLabels: true,
    // tsconfig
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
    // app.expandInputFiles([`${path.resolve(process.cwd(), "..", "..", "declarations")}`,`${process.cwd()}/src`])
    app.expandInputFiles([
      `${path.resolve(process.cwd(), "..", "..", "..", "declarations")}`,
      `../src`,
    ])
  );

  if (project) {
    const docsJsonPath = "../dist/docs.json";
    // app.generateDocs(project, "docs")
    const json = app.generateJson(project, path.resolve(docsJsonPath));
    if (json) {
      const typeDocJson = require(path.resolve(docsJsonPath));
      const bricksDocJson = generateBrickDoc(typeDocJson, scope);
      if (fs.existsSync(docsJsonPath)) {
        fs.writeFile(
          "../dist/docs.json",
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
