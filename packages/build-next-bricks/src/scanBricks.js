import path from "node:path";
import fs from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { parse } from "@babel/parser";
import babelTraverse from "@babel/traverse";
import _ from "lodash";
import getCamelPackageName from "./getCamelPackageName.js";

const { default: traverse } = babelTraverse;
const { escapeRegExp } = _;

const validBrickName =
  /^[a-z][a-z0-9]*(-[a-z0-9]+)*\.[a-z][a-z0-9]*(-[a-z0-9]+)+$/;
const validProcessorName = /^[a-z][a-zA-Z0-9]*\.[a-z][a-zA-Z0-9]*$/;

/**
 * Scan defined bricks by AST.
 *
 * @param {string} packageDir
 * @returns {Promise<Record<string, { import: string; name: string; }>>}
 */
export default async function scanBricks(packageDir) {
  /** @type {Map<string, { import: string; name: string; }>} */
  const exposes = new Map();
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

  /**
   *
   * @param {string} filePath
   */
  async function scanByFile(filePath) {
    if (processedFiles.has(filePath)) {
      return;
    }
    processedFiles.add(filePath);
    const dirname = path.dirname(filePath);
    const extname = path.extname(filePath);
    const content = await readFile(filePath, "utf-8");

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

    /** @type {Map<string, Set<string>} */
    const importPaths = new Map();
    traverse(ast, {
      CallExpression({ node: { callee, arguments: args } }) {
        // Match `getRuntime().registerCustomProcessor(...)`
        if (
          callee.type === "MemberExpression" &&
          callee.property.name === "registerCustomProcessor" &&
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
                .relative(packageDir, filePath)
                .replace(/\.[^.]+$/, "")
                .replace(/\/index$/, "")}`,
              name: processorName,
            });
          } else {
            throw new Error(
              "Please call `getRuntime().registerCustomProcessor()` only with literal string"
            );
          }
        }
      },
      Decorator({ node: { expression } }) {
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

          exposes.set(`./${brickName}`, {
            import: `./${path
              .relative(packageDir, filePath)
              .replace(/\.[^.]+$/, "")
              .replace(/\/index$/, "")}`,
            name: brickName,
          });
        }
      },
      ImportDeclaration({ node: { source } }) {
        // Match `import "..."`
        if (
          source.type === "StringLiteral" &&
          source.value.startsWith("./") &&
          source.value.endsWith(".js")
        ) {
          const importPath = path.resolve(dirname, source.value);
          const importDir = path.dirname(importPath);
          const importFile = path.basename(importPath, ".js");
          let files = importPaths.get(importDir);
          if (!files) {
            files = new Set();
            importPaths.set(importDir, files);
          }
          files.add(importFile);
        }
      },
    });

    await Promise.all([...importPaths.entries()].map(scanByImport));
  }

  /**
   *
   * @param {[string, Set<string>]} importEntry
   */
  async function scanByImport([dirname, files]) {
    const dirents = await readdir(dirname, { withFileTypes: true });
    const possibleFilenames = [...files].map(
      (filename) => new RegExp(`${escapeRegExp(filename)}\\.[tj]sx?`)
    );
    await Promise.all(
      dirents.map((dirent) => {
        if (
          dirent.isFile() &&
          possibleFilenames.some((regex) => regex.test(dirent.name))
        ) {
          const filePath = path.resolve(dirname, dirent.name);
          return scanByFile(filePath);
        }
      })
    );
  }

  const bootstrapTsPath = path.join(packageDir, "src/bootstrap.ts");
  if (!fs.existsSync(bootstrapTsPath)) {
    throw new Error(`File not found: ${bootstrapTsPath}`);
  }

  await scanByFile(bootstrapTsPath);

  return Object.fromEntries([...exposes.entries()]);
}
