import path from "node:path";
import fs, { existsSync, statSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { parse } from "@babel/parser";
import babelTraverse from "@babel/traverse";
import _ from "lodash";
import getCamelPackageName from "./getCamelPackageName.js";
import makeBrickManifest, {
  makeProviderManifest,
} from "./makeBrickManifest.js";
import {
  isImportDefaultSpecifier,
  isImportDeclaration,
  isImportSpecifier,
} from "@babel/types";
import getTypeDeclaration from "./getTypeDeclaration.js";
import isDeprecatedV2Packages from "./isDeprecatedV2Packages.js";
import { handleExamplesInMarkdown } from "./getDocs.js";

/**
 *
 * @typedef {import("@babel/traverse").NodePath} NodePath
 * @typedef {import("@next-core/brick-manifest").PackageManifest} PackageManifest
 * @typedef {import("@next-core/brick-manifest").ProviderManifest} ProviderManifest
 * @typedef {import("@next-core/brick-manifest").Declaration} Declaration
 * @typedef {{import: string; name: string; noNamespace?: boolean;}} Expose
 * @typedef {Record<string, Expose>} Exposes
 * @typedef {import("./makeBrickManifest.js").BrickManifestAndTypes} BrickManifestAndTypes
 */

const { default: traverse } = babelTraverse;
const { escapeRegExp } = _;

const validBrickName =
  /^[a-z][a-z0-9]*(-[a-z0-9]+)*\.[a-z][a-z0-9]*(-[a-z0-9]+)+$/;
const validCustomElementName = /^[a-z][a-z0-9]*(-[a-z0-9]+)+$/;
const validProcessorName = /^[a-z][a-zA-Z0-9]*\.[a-z][a-zA-Z0-9]*$/;
const validExposeName = /^[-\w]+$/;

/**
 * 读取外部包的构件依赖清单（支持选择性导入）
 * @param {string} packageName - 包名，如 "@shared/common-helpers"
 * @param {string[]} importedMembers - 导入的成员，如 ["renderButton", "renderModal"]
 * @param {boolean} isNamespaceImport - 是否为命名空间导入（import * as）
 * @param {string} packageDir - 当前 bricks 包的根目录
 * @returns {string[] | null} 构件依赖列表，失败时返回 null
 */
function loadExternalDependencies(
  packageName,
  importedMembers,
  isNamespaceImport,
  packageDir
) {
  try {
    // 使用 Node.js 模块解析机制，支持依赖提升
    let packageJsonPath;
    try {
      packageJsonPath = require.resolve(`${packageName}/package.json`, {
        paths: [packageDir],
      });
    } catch (_e) {
      console.warn(
        `警告: 未找到 ${packageName} 的 package.json，` + `请确保该包已安装`
      );
      return null;
    }

    const packageRoot = path.dirname(packageJsonPath);

    // 读取依赖清单文件
    const manifestPath = path.join(
      packageRoot,
      "dist",
      "brick-dependencies.json"
    );

    if (!existsSync(manifestPath)) {
      console.warn(
        `警告: 未找到 ${packageName} 的依赖清单文件，` +
          `请先构建该包或确保其已包含 brick-dependencies.json`
      );
      return null;
    }

    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

    // 验证清单格式
    if (!Array.isArray(manifest.brickDependencies)) {
      console.warn(`警告: ${packageName} 的依赖清单格式无效`);
      return null;
    }

    // 如果是命名空间导入（import * as），返回全量依赖
    if (isNamespaceImport) {
      console.log(
        `✓ 加载 ${packageName} 的全量构件依赖: ${manifest.brickDependencies.length} 个（命名空间导入）`
      );
      return manifest.brickDependencies;
    }

    // 如果支持按导出成员分组，且有导入成员信息，进行选择性加载
    if (
      manifest.brickDependenciesByExport &&
      importedMembers &&
      importedMembers.length > 0
    ) {
      const selectedDeps = new Set();
      let hasUnmappedMember = false;

      for (const member of importedMembers) {
        const memberDeps = manifest.brickDependenciesByExport[member];
        if (memberDeps) {
          memberDeps.forEach((dep) => selectedDeps.add(dep));
        } else {
          // 导入的成员在清单中找不到，标记为未映射
          hasUnmappedMember = true;
          console.warn(
            `警告: ${packageName} 的清单中未找到导出成员 "${member}" 的依赖信息`
          );
        }
      }

      // 如果有未映射的成员，为安全起见，包含全量依赖
      if (hasUnmappedMember) {
        console.log(
          `✓ 加载 ${packageName} 的全量构件依赖: ${manifest.brickDependencies.length} 个（包含未映射成员）`
        );
        return manifest.brickDependencies;
      }

      const selectedDepsArray = Array.from(selectedDeps);
      console.log(
        `✓ 加载 ${packageName} 的构件依赖: ${selectedDepsArray.length} 个（选择性导入: ${importedMembers.join(", ")}）`
      );
      return selectedDepsArray;
    }

    // 回退：使用全量依赖
    console.log(
      `✓ 加载 ${packageName} 的全量构件依赖: ${manifest.brickDependencies.length} 个`
    );
    return manifest.brickDependencies;
  } catch (error) {
    console.warn(`警告: 无法加载 ${packageName} 的依赖清单:`, error.message);
    return null;
  }
}

/**
 * Scan defined bricks by AST.
 *
 * @param {string} packageDir
 * @returns {Promise<{exposes: Exposes; dependencies: Record<string, string[]>; manifest: PackageManifest; types: Record<string, unknown>; examples: Record<string, {doc: string}>}>}
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
    providers: [],
  };

  /** @type {Map<string, Set<string>} */
  const usingWrappedBricks = new Map();

  /** @type {Map<string, string} */
  const brickSourceFiles = new Map();

  /** @type {Map<string, Set<string>} */
  const importsMap = new Map();

  /** @type {Map<string, Array<{packageName: string, importedMembers: string[], isNamespaceImport: boolean}>>} */
  const externalImports = new Map();

  /** @type {{ filePath: string; declaration: Declaration; usedReferences: Set<string> }[]} */
  const typeDeclarations = [];

  const bricksImportsInfo = {};

  /** @type {ProviderManifest[]} */
  const providerTypes = [];

  /**
   *
   * @param {string} filePath
   * @param {string | undefined} overrideImport
   */
  async function scanByFile(filePath, overrideImport) {
    if (processedFiles.has(filePath)) {
      return;
    }
    processedFiles.add(filePath);
    const dirname = path.dirname(filePath);
    const extname = path.extname(filePath);
    const content = await readFile(filePath, "utf-8");

    // Record top level functions for providers
    /** @type {Map<string, NodePath}  */
    const topLevelFunctions = new Map();
    /** @type {Map<string, string>}  */
    const providerMap = new Map();

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
     * @param {string | undefined} folder
     * @returns {string}
     */
    function getExposeName(originalName, folder) {
      /** @type {string} */
      let exposeName;
      if (overrideImport) {
        exposeName = path.basename(
          overrideImport.replace(/\.[^.]+$/, "").replace(/\/index$/, "")
        );
        if (!validExposeName.test(exposeName)) {
          throw new Error(
            `Invalid filename for merging bricks: "${exposeName}", only alphabets/digits/hyphens/underscores are allowed`
          );
        }
      } else {
        exposeName = originalName;
      }
      return `${folder ? `${folder}/` : ""}${exposeName}`;
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
      const hasNamespace = fullName.includes(".");
      if (hasNamespace) {
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
        if (!validCustomElementName.test(brickName)) {
          throw new Error(
            `Invalid brick: "${brickName}", the brick name must include a \`-\``
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
        [Symbol.for("noNamespace")]: !hasNamespace,
      });
    }

    traverse(ast, {
      CallExpression(nodePath) {
        const {
          node: { callee, arguments: args },
        } = nodePath;
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
          callee.object.name === "customEditors" &&
          !callee.property.computed &&
          callee.property.name === "define" &&
          args.length === 2
        ) {
          const { type, value: fullName } = args[0];
          if (type === "StringLiteral") {
            /** @type {string | undefined} */
            let editorNamespace;
            /** @type {string} */
            let editorName;
            if (fullName.includes(".")) {
              [editorNamespace, editorName] = fullName.split(".");

              if (
                editorNamespace !== packageName &&
                packageName !== "widget-editors"
              ) {
                throw new Error(
                  `Invalid editor: "${fullName}", expecting prefixed with the package name: "${packageName}"`
                );
              }

              if (!validBrickName.test(fullName)) {
                throw new Error(
                  `Invalid editor: "${fullName}", expecting: "PACKAGE-NAME.BRICK-NAME", where PACKAGE-NAME and BRICK-NAME must be lower-kebab-case, and BRICK-NAME must include a \`-\``
                );
              }
            } else {
              editorName = fullName;

              if (!editorName.startsWith("eo-")) {
                throw new Error(
                  `Invalid editor: "${editorName}", expecting prefixed with "eo-" for brick name without namespace`
                );
              }

              if (!validCustomElementName.test(editorName)) {
                throw new Error(
                  `Invalid editor: "${editorName}", expecting a \`-\` in editor name`
                );
              }
            }

            exposes.set(`./editors/${fullName}`, {
              import: `./${path
                .relative(packageDir, overrideImport || filePath)
                .replace(/\.[^.]+$/, "")
                .replace(/\/index$/, "")}`,
              name: getExposeName(editorName, "editors"),
            });
          } else {
            throw new Error(
              "Please call `customEditors.define()` only with literal string"
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
          const [{ type, value: fullName }, constructor] = args;
          if (type === "StringLiteral") {
            collectBrick(fullName);
            if (
              constructor.type === "CallExpression" &&
              constructor.callee.type === "Identifier" &&
              constructor.callee.name === "createProviderClass" &&
              constructor.arguments.length > 0 &&
              constructor.arguments[0].type === "Identifier"
            ) {
              providerMap.set(fullName, constructor.arguments[0].name);
            } else {
              manifest.providers.push({ name: fullName });
            }
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

          /** @type {string | undefined} */
          let brickNamespace;
          /** @type {string} */
          let brickName;
          const fullName = expression.arguments[0].value;
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
            brickName = fullName;

            if (!brickName.startsWith("eo-")) {
              throw new Error(
                `Invalid brick: "${brickName}", expecting prefixed with "eo-" for brick name without namespace`
              );
            }

            if (!validCustomElementName.test(brickName)) {
              throw new Error(
                `Invalid brick: "${brickName}", expecting a \`-\` in brick name`
              );
            }
          }

          const defineOptions = expression.arguments[1];
          /** @type {string[]} */
          const deps = [];
          /** @type {string[]} */
          const aliases = [];

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

            /** @type {import("@babel/types").ObjectProperty} */
            const alias = defineOptions.properties.find(
              (prop) =>
                prop.type === "ObjectProperty" &&
                prop.key.type === "Identifier" &&
                prop.key.name === "alias" &&
                !prop.computed
            );
            if (alias) {
              if (alias.value.type === "ArrayExpression") {
                for (const item of alias.value.elements) {
                  if (item.type === "StringLiteral") {
                    aliases.push(item.value);
                  } else {
                    throw new Error(
                      `Invalid item in brick dependencies: ${item.type} of brick: "${fullName}", expecting only StringLiteral`
                    );
                  }
                }
              } else {
                throw new Error(
                  `Invalid brick alias: ${alias.value.type} of brick: "${fullName}", expecting only ArrayExpression`
                );
              }
            }
          }
          if (deps.length > 0) {
            specifiedDeps[fullName] = deps;
          }

          brickFullName = fullName;

          brickSourceFiles.set(fullName, filePath);

          manifest.bricks.push(
            makeBrickManifest(
              fullName,
              aliases.length > 0 ? aliases : undefined,
              nodePath,
              content
            )
          );

          const expose = {
            import: `./${path
              .relative(packageDir, overrideImport || filePath)
              .replace(/\.[^.]+$/, "")
              .replace(/\/index$/, "")}`,
            name: getExposeName(brickName),
            [Symbol.for("noNamespace")]: !brickNamespace,
          };

          exposes.set(`./${brickName}`, expose);
          for (const alias of aliases) {
            brickSourceFiles.set(alias, filePath);
            let lastName;
            const hasNamespace = alias.includes(".");
            if (hasNamespace) {
              [, lastName] = alias.split(".");
            } else {
              lastName = alias;
            }
            exposes.set(`./${lastName}`, {
              ...expose,
              [Symbol.for("noNamespace")]: !hasNamespace,
            });
          }
        }
      },
      FunctionDeclaration(nodePath) {
        const { node, parent } = nodePath;
        if (
          node.id &&
          (parent.type === "Program" ||
            parent.type === "ExportNamedDeclaration" ||
            parent.type === "ExportDefaultDeclaration")
        ) {
          topLevelFunctions.set(node.id.name, nodePath);
        }
      },
      ImportDeclaration({ node: { source, importKind, specifiers } }) {
        // Match `import "..."`
        if (
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
        } else if (
          // 收集对 @shared/* 和 @next-shared/* 的导入
          (source.value.startsWith("@shared/") ||
            source.value.startsWith("@next-shared/")) &&
          importKind === "value"
        ) {
          const packageName = source.value.split("/").slice(0, 2).join("/");

          // 收集导入的成员
          const importedMembers = [];
          let isNamespaceImport = false; // import * as foo

          // 如果是副作用导入（import "@shared/pkg"），使用全量依赖
          if (specifiers.length === 0) {
            isNamespaceImport = true;
          }

          for (const specifier of specifiers) {
            if (specifier.type === "ImportSpecifier") {
              // import { foo, bar } from "@shared/helpers"
              // 处理字符串导入名：import { "some-name" as alias } from "..."
              const importedName =
                specifier.imported.type === "StringLiteral"
                  ? specifier.imported.value
                  : specifier.imported.name;
              importedMembers.push(importedName);
            } else if (specifier.type === "ImportDefaultSpecifier") {
              // import foo from "@shared/helpers"
              importedMembers.push("default");
            } else if (specifier.type === "ImportNamespaceSpecifier") {
              // import * as foo from "@shared/helpers"
              isNamespaceImport = true;
            }
          }

          const existingImports = externalImports.get(filePath) ?? [];
          const existing = existingImports.find(
            (item) => item.packageName === packageName
          );

          if (existing) {
            // 合并导入成员（去重）
            if (isNamespaceImport) {
              existing.isNamespaceImport = true;
            }
            const existingSet = new Set(existing.importedMembers);
            importedMembers.forEach((member) => existingSet.add(member));
            existing.importedMembers = [...existingSet];
          } else {
            externalImports.set(filePath, [
              ...existingImports,
              {
                packageName,
                importedMembers,
                isNamespaceImport,
              },
            ]);
          }
        }

        if (isDeprecatedV2Packages(source.value)) {
          throw new Error(
            `Using deprecated v2 packages is prohibited in v3: "${source.value}"`
          );
        }
      },
      TSInterfaceDeclaration({ node }) {
        const usedReferences = new Set();
        typeDeclarations.push({
          filePath,
          declaration: getTypeDeclaration(node, content, usedReferences),
          usedReferences,
        });
      },
      TSTypeAliasDeclaration({ node }) {
        const usedReferences = new Set();
        typeDeclarations.push({
          filePath,
          declaration: getTypeDeclaration(node, content, usedReferences),
          usedReferences,
        });
      },
      TSEnumDeclaration: ({ node }) => {
        const usedReferences = new Set();
        typeDeclarations.push({
          filePath,
          declaration: getTypeDeclaration(node, content, usedReferences),
          usedReferences,
        });
      },
    });

    await Promise.all(
      [...importPaths.entries()].map((item) =>
        scanByImport(item, filePath, nextOverrideImport)
      )
    );

    if (brickFullName || providerMap.size > 0) {
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

      if (brickFullName) {
        bricksImportsInfo[brickFullName] = {
          imports,
          filePath,
        };
      }
      for (const providerName of providerMap.keys()) {
        bricksImportsInfo[providerName] = {
          imports,
          filePath,
        };
      }
    }

    if (providerMap.size > 0) {
      for (const [providerName, providerConstructor] of providerMap) {
        const nodePath = topLevelFunctions.get(providerConstructor);
        if (nodePath) {
          const { description, deprecated, ...restTypes } =
            makeProviderManifest(providerName, nodePath, content);
          providerTypes.push(restTypes);
          manifest.providers.push({
            name: providerName,
            description,
            deprecated,
          });
        } else {
          manifest.providers.push({ name: providerName });
        }
      }
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
          const dirName = path.dirname(file);
          const lastName = path.basename(file);
          const matchExtension = /\.[tj]sx?$/.test(lastName);
          const noExtension = !lastName.includes(".");
          /** @type {[string, Set<string>]} */
          let fileInfo;

          if (matchExtension || noExtension) {
            fileInfo = [dirName, new Set([lastName.replace(/\.[^.]+$/, "")])];
          }
          if (noExtension && existsSync(file) && statSync(file).isDirectory()) {
            fileInfo = [dirName, new Set(["index"])];
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

  // 收集外部包的构件依赖（支持选择性导入）
  const externalDepsCache = new Map(); // 缓存外部包的依赖，键: "packageName:member1,member2,..."

  for (const [brickName, sourcePath] of brickSourceFiles.entries()) {
    const analyzedFiles = new Set();
    const externalDeps = new Set();

    const analyzeExternal = (filePath) => {
      if (analyzedFiles.has(filePath)) {
        return;
      }
      analyzedFiles.add(filePath);

      // 收集该文件导入的外部包
      for (const externalImport of externalImports.get(filePath) ?? []) {
        const { packageName, importedMembers, isNamespaceImport } =
          externalImport;

        // 构建缓存键
        const cacheKey = isNamespaceImport
          ? `${packageName}:*` // 命名空间导入
          : `${packageName}:${[...new Set(importedMembers)].sort().join(",")}`; // 选择性导入

        // 从缓存或文件中加载外部依赖
        let deps = externalDepsCache.get(cacheKey);
        if (!deps) {
          deps = loadExternalDependencies(
            packageName,
            importedMembers,
            isNamespaceImport,
            packageDir
          );
          if (deps) {
            externalDepsCache.set(cacheKey, deps);
          }
        }

        // 添加到当前构件的依赖中
        if (deps) {
          for (const dep of deps) {
            if (dep !== brickName) {
              externalDeps.add(dep);
            }
          }
        }
      }

      // 递归分析本地导入的文件
      for (const item of importsMap.get(filePath) ?? []) {
        analyzeExternal(item);
      }
    };

    analyzeExternal(sourcePath);

    // 合并本地依赖和外部依赖（去重）
    if (externalDeps.size > 0) {
      const allDeps = new Set([
        ...(analyzedDeps[brickName] ?? []),
        ...externalDeps,
      ]);
      analyzedDeps[brickName] = [...allDeps];
    }
  }

  function isMatch(importPath, filePath) {
    return (
      importPath.replace(/\.[^.]+$/, "") === filePath.replace(/\.[^.]+$/, "")
    );
  }

  /**
   *
   * @param {string} name
   * @param {Record<string, unknown} importInfo
   * @param {Set<string>} importKeysSet
   * @param {string} realFilePath
   * @returns {void}
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

    const { declaration, usedReferences } =
      typeDeclarations.find(
        (item) =>
          isMatch(item.filePath, importPath) && item.declaration.name === name
      ) ?? {};

    if (declaration) {
      importInfo.types = (importInfo.types || []).concat(declaration);
      for (const ref of usedReferences) {
        findType(ref, importInfo, importKeysSet, importPath);
      }
    }
  }

  manifest.bricks.forEach((/** @type {BrickManifestAndTypes} */ brickDoc) => {
    const {
      name,
      types: { usedReferences, ...types },
    } = brickDoc;
    const importInfo = bricksImportsInfo[name];
    Object.assign(importInfo, types);

    const importKeysSet = new Set();
    for (const ref of usedReferences) {
      findType(ref, importInfo, importKeysSet);
    }
    delete brickDoc.types;
  });

  for (const providerDoc of providerTypes) {
    const importInfo = bricksImportsInfo[providerDoc.name];

    const importKeysSet = new Set();
    for (const ref of providerDoc.usedReferences) {
      findType(ref, importInfo, importKeysSet);
    }
    delete providerDoc.usedReferences;
  }

  /** @type {Record<string, {doc: string}>} */
  const examples = {};
  const srcDocsDir = path.join(packageDir, "docs");

  for (const brick of manifest.bricks.concat(manifest.providers ?? [])) {
    const lastName = brick.name.split(".").pop();

    const srcFilePath = path.join(srcDocsDir, `${brick.name}.md`);
    const srcFilePathAlt = path.join(srcDocsDir, `${lastName}.md`);

    /** @type {string} */
    let brickDoc;
    if (existsSync(srcFilePath)) {
      brickDoc = await handleExamplesInMarkdown(
        await readFile(srcFilePath, "utf-8"),
        [manifest]
      );
    } else if (existsSync(srcFilePathAlt)) {
      brickDoc = await handleExamplesInMarkdown(
        await readFile(srcFilePathAlt, "utf-8"),
        [manifest]
      );
    }
    if (brickDoc) {
      examples[brick.name] = {
        doc: brickDoc,
      };
    }
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
      Object.entries(bricksImportsInfo)
        .map(([k, v]) => {
          return [
            k,
            {
              properties: v.properties,
              events: v.events,
              methods: v.methods,
              types: v.types,
            },
          ];
        })
        .concat(
          providerTypes.map(({ name, ...types }) => [
            name,
            {
              ...types,
              types: bricksImportsInfo[name]?.types,
            },
          ])
        )
    ),
    examples,
  };
}
