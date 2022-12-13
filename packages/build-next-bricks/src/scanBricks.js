import path from "node:path";
import fs from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { parse } from "@babel/parser";
import babelTraverse from "@babel/traverse";
import _ from "lodash";

const { default: traverse } = babelTraverse;
const { escapeRegExp } = _;

/**
 * Scan defined bricks by AST.
 *
 * @param {string} packageDir
 * @returns {Record<string, { import: string; name: string; }>}
 */
export default async function scanBricks(packageDir) {
  /** @type {Map<string, { import: string; name: string; }>} */
  const exposes = new Map();
  /** @type {Set<string>} */
  const processedFiles = new Set();

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
    const ast = parse(content, {
      sourceType: "module",
      plugins: [
        (extname === ".ts" || extname === ".tsx") && "typescript",
        (extname === ".jsx" || extname === ".tsx") && "jsx",
        "decorators",
      ].filter(Boolean),
    });

    /** @type {Map<string, Set<string>} */
    const importPaths = new Map();
    traverse(ast, {
      Decorator({ node: { expression } }) {
        if (
          expression.type === "CallExpression" &&
          expression.callee.type === "Identifier" &&
          expression.callee.name === "defineElement" &&
          expression.arguments.length === 1 &&
          expression.arguments[0].type === "StringLiteral"
        ) {
          const brick = expression.arguments[0].value;
          exposes.set(`./${brick}`, {
            import: `./${path
              .relative(packageDir, filePath)
              .replace(/\.[^.]+$/, "")
              .replace(/\/index$/, "")}`,
            name: brick,
          });
        }
      },
      ImportDeclaration({ node: { source } }) {
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
