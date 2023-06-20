import path from "node:path";
import fs, { existsSync, statSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { parse } from "@babel/parser";
import babelTraverse from "@babel/traverse";
import _ from "lodash";
import getCamelPackageName from "./getCamelPackageName.js";
import makeBrickManifest from "./makeBrickManifest.js";
import { BASE_TYPE, TS_KEYWORD_LIST, getTypeAnnotation } from "./utils.js";
import {
  isImportDefaultSpecifier,
  isImportDeclaration,
  isImportSpecifier,
} from "@babel/types";

/**
 * @typedef {import("@next-core/brick-manifest").PackageManifest} PackageManifest
 * @typedef {{import: string; name: string; noNamespace?: boolean;}} Expose
 * @typedef {Record<string, Expose>} Exposes
 */

const { default: traverse } = babelTraverse;
const { escapeRegExp } = _;

const validBrickName =
  /^[a-z][a-z0-9]*(-[a-z0-9]+)*\.[a-z][a-z0-9]*(-[a-z0-9]+)+$/;
const validCustomElementName = /^[a-z][a-z0-9]*(-[a-z0-9]+)+$/;
const validProcessorName = /^[a-z][a-zA-Z0-9]*\.[a-z][a-zA-Z0-9]*$/;
const validExposeName = /^[-\w]+$/;

/**
 * Scan defined bricks by AST.
 *
 * @param {string} packageDir
 * @returns {Promise<{exposes: Exposes; dependencies: Record<string, string[]>; manifest: PackageManifest; types: Record<string, unknown>}>}
 */
export default async function scanBricks(packageDir) {
  /** @type {Map<string, Expose>} */
  const exposes = new Map();
  /** @type {Record<string, string[]>} */
  const specifiedDeps = {};
  /** @type {Set<string>} */
  const processedFiles = new Set();

  const packageJsonFile = await readFile(
    path.join(packageDir, "package.json"),
    { encoding: "utf-8" }
  );
  const packageJson = JSON.parse(packageJsonFile);
  /** @type {string} */
  const packageName = packageJson.name.split("/").pop();
  const camelPackageName = getCamelPackageName(packageName);

  /** @type {PackageManifest} */
  const manifest = {
    manifest_version: 1,
    package: packageJson.name,
    name: packageName,
    bricks: [],
  };

  /** @type {Map<string, Set<string>} */
  const usingWrappedBricks = new Map();

  /** @type {Map<string, string} */
  const brickSourceFiles = new Map();

  /** @type {Map<string, Set<string>} */
  const importsMap = new Map();

  const typescriptList = [];

  const bricksImportsInfo = {};

  /**
   *
   * @param {string} filePath
   * @param {string | undefined} overrideImport
   */
  async function scanByFile(filePath, overrideImport) {
    if (processedFiles.has(filePath)) {
      console.warn(
        "[scan-bricks] warn: the file has already been scanned:",
        filePath
      );
      return;
    }
    processedFiles.add(filePath);
    const dirname = path.dirname(filePath);
    const extname = path.extname(filePath);
    const content = await readFile(filePath, "utf-8");

    /** @type {Record<string, string[]>} */
    /** @type {string}  */
    let brickFullName;
    /** @type {ReturnType<typeof import("@babel/parser").parse>} */
    let ast;
    try {
      ast = parse(content, {
        sourceType: "module",
        plugins: [
          (extname === ".ts" || extname === ".tsx") && "typescript",
          (extname === ".jsx" || extname === ".tsx") && "jsx",
          "decorators",
          "decoratorAutoAccessors",
        ].filter(Boolean),
      });
    } catch (e) {
      console.error("Babel parse failed:", filePath);
      console.error(e);
    }

    /** @type {string | undefined} */
    let nextOverrideImport = overrideImport;
    if (content.startsWith("// Merge bricks")) {
      nextOverrideImport = filePath;
    } else if (content.startsWith("// Define brick")) {
      // Match any source files starting with specific comments:
      // `// Define brick: sl-alert` or
      // `// Define bricks: sl-alert, sl-icon`
      const firstLine = content.split("\n", 1)[0];
      const match = firstLine.match(/^\/\/ Define bricks?: (.+)$/);
      if (match) {
        const bricks = match[1].split(/,\s*/g);
        for (const brick of bricks) {
          collectBrick(brick);
        }
      }
    }

    /**
     *
     * @param {string} originalName
     * @returns {string}
     */
    function getExposeName(originalName) {
      if (overrideImport) {
        const exposeName = path.basename(
          overrideImport.replace(/\.[^.]+$/, "").replace(/\/index$/, "")
        );
        if (!validExposeName.test(exposeName)) {
          throw new Error(
            `Invalid filename for merging bricks: "${exposeName}", only alphabets/digits/hyphens/underscores are allowed`
          );
        }
        return exposeName;
      }
      return originalName;
    }

    /** @type {Map<string, Set<string>} */
    const importPaths = new Map();

    /**
     * @param {string} dir
     * @param {string} file
     */
    function addImportFile(dir, file) {
      const files = importPaths.get(dir);
      if (files) {
        files.add(file);
      } else {
        importPaths.set(dir, new Set([file]));
      }
    }

    /**
     * @param {string} fullName
     */
    function collectBrick(fullName) {
      /** @type string */
      let brickNamespace;
      /** @type string */
      let brickName;
      let noNamespace = false;
      if (fullName.includes(".")) {
        [brickNamespace, brickName] = fullName.split(".");
        if (brickNamespace !== packageName) {
          throw new Error(
            `Invalid brick: "${fullName}", expecting prefixed with the package name: "${packageName}"`
          );
        }

        if (!validBrickName.test(fullName)) {
          throw new Error(
            `Invalid brick: "${fullName}", expecting: "PACKAGE-NAME.BRICK-NAME", where PACKAGE-NAME and BRICK-NAME must be lower-kebab-case, and BRICK-NAME must include a \`-\``
          );
        }

        if (brickName.startsWith("tpl-")) {
          throw new Error(
            `Invalid brick: "${fullName}", the brick name cannot be started with "tpl-"`
          );
        }
      } else {
        // For third-party custom elements, there maybe no namespace.
        brickName = fullName;
        noNamespace = true;
        if (!validCustomElementName.test(brickName)) {
          throw new Error(
            `Invalid brick: "${fullName}", the brick name must include a \`-\``
          );
        }
      }

      brickSourceFiles.set(fullName, filePath);

      exposes.set(`./${brickName}`, {
        import: `./${path
          .relative(packageDir, overrideImport || filePath)
          .replace(/\.[^.]+$/, "")
          .replace(/\/index$/, "")}`,
        name: getExposeName(brickName),
        [Symbol.for("noNamespace")]: noNamespace,
      });
    }

    traverse(ast, {
      CallExpression({ node: { callee, arguments: args } }) {
        // Match `customProcessors.define(...)`
        // Match `customElements.define(...)`
        if (
          callee.type === "MemberExpression" &&
          callee.object.type === "Identifier" &&
          callee.object.name === "customProcessors" &&
          !callee.property.computed &&
          callee.property.name === "define" &&
          args.length === 2
        ) {
          const { type, value: fullName } = args[0];
          if (type === "StringLiteral") {
            const [processorNamespace, processorName] = fullName.split(".");
            if (processorNamespace !== camelPackageName) {
              throw new Error(
                `Invalid custom processor: "${fullName}", expecting prefixed with the camelCase package name: "${camelPackageName}"`
              );
            }

            if (!validProcessorName.test(fullName)) {
              throw new Error(
                `Invalid custom processor: "${fullName}", expecting format of "camelPackageName.camelProcessorName"`
              );
            }

            exposes.set(`./processors/${processorName}`, {
              import: `./${path
                .relative(packageDir, overrideImport || filePath)
                .replace(/\.[^.]+$/, "")
                .replace(/\/index$/, "")}`,
              name: getExposeName(processorName),
            });
          } else if (packageName !== "v2-adapter") {
            throw new Error(
              "Please call `customProcessors.define()` only with literal string"
            );
          }
        } else if (
          callee.type === "MemberExpression" &&
          callee.object.type === "Identifier" &&
          callee.object.name === "customElements" &&
          !callee.property.computed &&
          callee.property.name === "define" &&
          args.length === 2
        ) {
          const { type, value: fullName } = args[0];
          if (type === "StringLiteral") {
            collectBrick(fullName);
          } else {
            throw new Error(
              "Please call `customElements.define()` only with literal string"
            );
          }
        } else if (
          callee.type === "MemberExpression" &&
          callee.object.type === "Identifier" &&
          callee.object.name === "customTemplates" &&
          !callee.property.computed &&
          callee.property.name === "define" &&
          args.length === 2
        ) {
          const { type, value: fullName } = args[0];
          if (type === "StringLiteral") {
            const [brickNamespace, brickName] = fullName.split(".");
            if (brickNamespace !== packageName) {
              throw new Error(
                `Invalid custom template: "${fullName}", expecting prefixed with the package name: "${packageName}"`
              );
            }

            if (!validBrickName.test(fullName)) {
              throw new Error(
                `Invalid custom template: "${fullName}", expecting: "PACKAGE-NAME.BRICK-NAME", where PACKAGE-NAME and BRICK-NAME must be lower-kebab-case, and BRICK-NAME must include a \`-\``
              );
            }

            if (!brickName.startsWith("tpl-")) {
              throw new Error(
                `Invalid custom template: "${fullName}", the custom template name must be started with "tpl-"`
              );
            }

            exposes.set(`./${brickName}`, {
              import: `./${path
                .relative(packageDir, overrideImport || filePath)
                .replace(/\.[^.]+$/, "")
                .replace(/\/index$/, "")}`,
              name: getExposeName(brickName),
            });
          } else if (packageName !== "v2-adapter") {
            throw new Error(
              "Please call `customTemplates.define()` only with literal string"
            );
          }
        } else if (
          callee.type === "Identifier" &&
          (callee.name === "wrapBrick" || callee.name === "unwrapProvider") &&
          args.length >= 1
        ) {
          const { type, value: brickName } = args[0];
          if (type !== "StringLiteral") {
            throw new Error(
              `Please call \`${callee.name}\` only with literal string`
            );
          }
          const bricks = usingWrappedBricks.get(filePath);
          if (bricks) {
            bricks.add(brickName);
          } else {
            usingWrappedBricks.set(filePath, new Set([brickName]));
          }
        }
      },
      Decorator(nodePath) {
        const {
          node: { expression },
        } = nodePath;
        // Match `@defineElement(...)`
        if (
          expression.type === "CallExpression" &&
          expression.callee.type === "Identifier" &&
          expression.callee.name === "defineElement" &&
          expression.arguments.length > 0
        ) {
          if (expression.arguments[0].type !== "StringLiteral") {
            throw new Error(
              "Please call `@defineElement()` only with literal string"
            );
          }

          const fullName = expression.arguments[0].value;
          const [brickNamespace, brickName] = fullName.split(".");

          if (brickNamespace !== packageName) {
            throw new Error(
              `Invalid brick: "${fullName}", expecting prefixed with the package name: "${packageName}"`
            );
          }

          if (!validBrickName.test(fullName)) {
            throw new Error(
              `Invalid brick: "${fullName}", expecting: "PACKAGE-NAME.BRICK-NAME", where PACKAGE-NAME and BRICK-NAME must be lower-kebab-case, and BRICK-NAME must include a \`-\``
            );
          }

          if (brickName.startsWith("tpl-")) {
            throw new Error(
              `Invalid brick: "${fullName}", the brick name cannot be started with "tpl-"`
            );
          }

          const defineOptions = expression.arguments[1];
          const deps = [];
          if (defineOptions && defineOptions.type === "ObjectExpression") {
            /** @type {import("@babel/types").ObjectProperty} */
            const brickDeps = defineOptions.properties.find(
              (prop) =>
                prop.type === "ObjectProperty" &&
                prop.key.type === "Identifier" &&
                prop.key.name === "dependencies" &&
                !prop.computed
            );
            if (brickDeps) {
              if (brickDeps.value.type === "ArrayExpression") {
                for (const item of brickDeps.value.elements) {
                  if (item.type === "StringLiteral") {
                    deps.push(item.value);
                  } else {
                    throw new Error(
                      `Invalid item in brick dependencies: ${item.type} of brick: "${fullName}", expecting only StringLiteral`
                    );
                  }
                }
              } else {
                throw new Error(
                  `Invalid brick dependencies: ${brickDeps.value.type} of brick: "${fullName}", expecting only ArrayExpression`
                );
              }
            }
          }
          if (deps.length > 0) {
            specifiedDeps[fullName] = deps;
          }

          brickFullName = fullName;

          brickSourceFiles.set(fullName, filePath);

          manifest.bricks.push(makeBrickManifest(fullName, nodePath, content));

          exposes.set(`./${brickName}`, {
            import: `./${path
              .relative(packageDir, overrideImport || filePath)
              .replace(/\.[^.]+$/, "")
              .replace(/\/index$/, "")}`,
            name: getExposeName(brickName),
          });
        }
      },
      ImportDeclaration({ node: { source, importKind } }) {
        // Match `import "..."`
        if (
          source.type === "StringLiteral" &&
          // Ignore import from node modules.
          (source.value.startsWith("./") || source.value.startsWith("../")) &&
          // Ignore `import type {...} from "..."`
          importKind === "value"
          // Ignore `import { ... } from "..."`
          // && specifiers.length === 0
        ) {
          const importPath = path.resolve(dirname, source.value);
          const lastName = path.basename(importPath);
          const matchExtension = /\.[tj]sx?$/.test(lastName);
          const noExtension = !lastName.includes(".");
          if (matchExtension || noExtension) {
            addImportFile(
              path.dirname(importPath),
              lastName.replace(/\.[^.]+$/, "")
            );
          }
          if (
            noExtension &&
            existsSync(importPath) &&
            statSync(importPath).isDirectory()
          ) {
            // When matching `import "./directory"`,
            // also look for "./directory/index.*"
            addImportFile(importPath, "index");
          }
        }
      },
      TSInterfaceDeclaration({ node }) {
        if (!node.id) return;
        typescriptList.push({
          ...(getTypeAnnotation(node, content) || {}),
          filePath,
        });
      },
      TSTypeAliasDeclaration({ node }) {
        typescriptList.push({
          ...(getTypeAnnotation(node, content) || {}),
          filePath,
        });
      },
      TSEnumDeclaration: ({ node }) => {
        typescriptList.push({
          ...(getTypeAnnotation(node, content) || {}),
          filePath,
        });
      },
    });

    await Promise.all(
      [...importPaths.entries()].map((item) =>
        scanByImport(item, filePath, nextOverrideImport)
      )
    );

    if (brickFullName) {
      const imports = ast.program.body
        .map((item) => {
          if (isImportDeclaration(item)) {
            const { source, specifiers } = item;
            if (
              source.type === "StringLiteral" &&
              (source.value.startsWith("./") ||
                source.value.startsWith("../")) &&
              !source.value.endsWith(".css")
            ) {
              const importPath = path.resolve(dirname, source.value);
              const importKeys = [];
              for (let i = 0; i < specifiers.length; i++) {
                const importItem = specifiers[i];
                if (isImportSpecifier(importItem)) {
                  importKeys.push(importItem.imported.name);
                } else if (isImportDefaultSpecifier(importItem)) {
                  importKeys.push(importItem.local.name);
                }
              }
              return {
                keys: importKeys,
                path: importPath,
              };
            }
          }
          return false;
        })
        .filter(Boolean);

      bricksImportsInfo[brickFullName] = {
        imports,
        filePath,
      };
    }
  }

  /**
   *
   * @param {[string, Set<string>]} importEntry
   * @param {string} importFrom
   * @param {string | undefined} overrideImport
   */
  async function scanByImport([dirname, files], importFrom, overrideImport) {
    // Ignore missing imports (maybe auto generated)
    if (!existsSync(dirname)) {
      return;
    }
    const dirents = await readdir(dirname, { withFileTypes: true });
    const possibleFilenames = [...files].map(
      (filename) => new RegExp(`${escapeRegExp(filename)}\\.[tj]sx?$`)
    );
    await Promise.all(
      dirents.map((dirent) => {
        if (
          dirent.isFile() &&
          possibleFilenames.some((regex) => regex.test(dirent.name))
        ) {
          const filePath = path.resolve(dirname, dirent.name);
          const imports = importsMap.get(importFrom);
          if (imports) {
            imports.add(filePath);
          } else {
            importsMap.set(importFrom, new Set([filePath]));
          }
          return scanByFile(filePath, overrideImport);
        }
      })
    );
  }

  const bootstrapTsPath = path.join(packageDir, "src/bootstrap.ts");
  if (!fs.existsSync(bootstrapTsPath)) {
    throw new Error(`File not found: ${bootstrapTsPath}`);
  }

  await scanByFile(bootstrapTsPath);

  async function checkMissLoadFile() {
    const processedFilesList = [...processedFiles];
    const files = Object.values(bricksImportsInfo)
      .map(({ imports }) => {
        return imports.map(
          (item) =>
            !processedFilesList.find((path) => isMatch(path, item.path)) &&
            item.path
        );
      })
      .flat(1)
      .filter(Boolean);

    if (files.length) {
      await Promise.all(
        [...new Set(files)].map((file) => {
          const fileName = path.dirname(file);
          const lastName = path.basename(file);
          const matchExtension = /\.[tj]sx?$/.test(lastName);
          const noExtension = !lastName.includes(".");
          let fileInfo;

          if (matchExtension || noExtension) {
            fileInfo = [fileName, lastName.replace(/\.[^.]+$/, "")];
          }
          if (noExtension && existsSync(file) && statSync(file).isDirectory()) {
            fileInfo = [fileName, "index"];
          }

          if (fileInfo) {
            return scanByImport(fileInfo, "", "");
          }
        })
      );
    }
  }

  await checkMissLoadFile();

  // console.log("usingWrappedBricks:", usingWrappedBricks);
  // console.log("brickSourceFiles:", brickSourceFiles);
  // console.log("importsMap:", importsMap);

  // Find brick dependencies by static analysis.
  /** @type {Record<string, string[]>} */
  const analyzedDeps = {};
  for (const [brickName, sourcePath] of brickSourceFiles.entries()) {
    /** @type {Set<string>} */
    const deps = new Set();
    /** @type {Set<string>} */
    const analyzedFiles = new Set();
    const analyze = (filePath) => {
      if (analyzedFiles.has(filePath)) {
        return;
      }
      if (brickName === "button-with-icon") {
        console.log("scan:", filePath);
      }
      analyzedFiles.add(filePath);
      for (const dep of usingWrappedBricks.get(filePath) ?? []) {
        // Do not dependent on itself
        if (dep !== brickName) {
          deps.add(dep);
        }
      }
      for (const item of importsMap.get(filePath) ?? []) {
        analyze(item);
      }
    };
    analyze(sourcePath);
    if (deps.size > 0) {
      analyzedDeps[brickName] = [...deps];
    }
  }

  function ingoreField(obj) {
    return _.omit(obj, ["filePath", "reference"]);
  }
  function isMatch(importPath, filePath) {
    return (
      importPath.replace(/\.[^.]+$/, "") === filePath.replace(/\.[^.]+$/, "")
    );
  }

  /**
   *
   * @param {string} type
   * @param {Record<string, unknown} importInfo
   * @param {Set<string>} importKeysSet
   * @param {string} realFilePath
   * @returns void
   */
  function findType(name, importInfo, importKeysSet, realFilePath = "") {
    if (importKeysSet.has(name)) return;
    importKeysSet.add(name);

    const { imports, filePath } = importInfo;
    const importItem = imports.find((item) => item.keys.includes(name));
    const importPath = realFilePath
      ? realFilePath
      : importItem
      ? importItem.path
      : filePath;

    const interfaceItem = typescriptList.find(
      (item) => isMatch(item.filePath, importPath) && item.name === name
    );

    if (interfaceItem) {
      importInfo.types = (importInfo.types || []).concat(
        ingoreField(interfaceItem)
      );
      findRefrenceItem(
        interfaceItem.extends,
        importInfo,
        importKeysSet,
        importPath
      );
      findRefrenceItem(
        interfaceItem.reference,
        importInfo,
        importKeysSet,
        importPath
      );
    }
  }

  function findRefrenceItem(list, importInfo, importKeySet, realFilePath = "") {
    if (Array.isArray(list) && list.length) {
      list.forEach((item) =>
        findType(item, importInfo, importKeySet, realFilePath)
      );
    }
  }

  if (manifest && manifest.bricks.length) {
    manifest.bricks.forEach((brickDoc) => {
      const { name, properties } = brickDoc;
      const importInfo = bricksImportsInfo[name];
      const fieldTypes = properties
        .map(
          ({ type }) =>
            type &&
            type
              .match(/\w+/g)
              .filter(
                (item) => !(BASE_TYPE[item] || TS_KEYWORD_LIST.includes(item))
              )
        )
        .flat(1);

      const importKeysSet = new Set();
      if (Array.isArray(fieldTypes) && fieldTypes.length) {
        [...new Set(fieldTypes)].forEach((type) =>
          findType(type, importInfo, importKeysSet)
        );
      }
    });
  }

  // console.log("exposes:", exposes);

  return {
    exposes: Object.fromEntries([...exposes.entries()]),
    dependencies: {
      ...analyzedDeps,
      ...specifiedDeps,
    },
    manifest,
    types: Object.fromEntries(
      Object.entries(bricksImportsInfo).map(([k, v]) => {
        return [k, v.types];
      })
    ),
  };
}
