import path from "node:path";
import fs from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import ts from "typescript";
import _ from "lodash";

const { escapeRegExp } = _;

/**
 * Scan defined bricks by AST.
 *
 * @param {string} packageDir
 * @returns {Record<string, { import: string; name: string; }>}
 */
export default async function scanBricksV2(packageDir) {
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
    console.log("processing:", filePath);
    processedFiles.add(filePath);
    const dirname = path.dirname(filePath);
    const content = await readFile(filePath, "utf-8");

    /** @type {ReturnType<typeof import("typescript").createSourceFile>} */
    let ast;
    try {
      ast = ts.createSourceFile(filePath, content, ts.ScriptTarget.ESNext);
    } catch (e) {
      console.error("Typescript parse failed:", filePath);
      console.error(e);
    }

    /** @type {Map<string, Set<string>} */
    const importPaths = new Map();
    ts.forEachChild(ast, (node) => {
      switch (node.kind) {
        case ts.SyntaxKind.ImportDeclaration: {
          /** @type {import("typescript").ImportDeclaration} */
          const decNode = node;
          if (
            decNode.moduleSpecifier.kind === ts.SyntaxKind.StringLiteral &&
            decNode.moduleSpecifier.text.startsWith("./") &&
            decNode.moduleSpecifier.text.endsWith(".js")
          ) {
            const importPath = path.resolve(
              dirname,
              decNode.moduleSpecifier.text
            );
            const importDir = path.dirname(importPath);
            const importFile = path.basename(importPath, ".js");
            let files = importPaths.get(importDir);
            if (!files) {
              files = new Set();
              importPaths.set(importDir, files);
            }
            files.add(importFile);
          }
          break;
        }
        case ts.SyntaxKind.ClassDeclaration: {
          /** @type {import("typescript").ClassDeclaration} */
          const classNode = node;

          /** @type {import("typescript").Decorator} */
          const decorator = classNode.modifiers?.find(
            (modifier) => modifier.kind === ts.SyntaxKind.Decorator
          );

          if (
            decorator &&
            decorator.expression.kind === ts.SyntaxKind.CallExpression &&
            decorator.expression.expression.kind === ts.SyntaxKind.Identifier &&
            decorator.expression.expression.escapedText === "defineElement" &&
            decorator.expression.arguments.length === 1 &&
            decorator.expression.arguments[0].kind ===
              ts.SyntaxKind.StringLiteral
          ) {
            const brick = decorator.expression.arguments[0].text;
            exposes.set(`./${brick}`, {
              import: `./${path
                .relative(packageDir, filePath)
                .replace(/\.[^.]+$/, "")
                .replace(/\/index$/, "")}`,
              name: brick,
            });
          }
          break;
        }
      }
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
