import path from "path";
import fs from "fs-extra";
import { snakeCase, pascalCase } from "change-case";
import { parse, ParserPlugin } from "@babel/parser";
import * as t from "@babel/types";
import traverse from "@babel/traverse";
import resolve from "resolve";
import chalk from "chalk";

export function getContractDeps(
  packageDir: string,
  relativeEntryPath: string
): string[] {
  const deps = new Set<string>();
  collectContracts(path.join(packageDir, relativeEntryPath), deps, new Set());
  return Array.from(deps);
}

export function getContractDepsByBrick(
  brickPackageDir: string,
  brickEntries: Record<string, string>
): Map<string, string[]> {
  const brickContractDeps = new Map<string, string[]>();
  for (const [brick, relativeEntryPath] of Object.entries(brickEntries)) {
    brickContractDeps.set(
      brick,
      getContractDeps(brickPackageDir, relativeEntryPath)
    );
  }
  return brickContractDeps;
}

function collectContracts(
  entryPath: string,
  deps: Set<string>,
  memo: Set<string>
): void {
  if (memo.has(entryPath)) {
    return;
  }
  memo.add(entryPath);

  // Ignore non-js files such as css.
  if (!/\.[tj]sx?$/.test(entryPath)) {
    return;
  }

  const plugins: ParserPlugin[] = [
    ["decorators", { decoratorsBeforeExport: true }],
  ];
  if (entryPath.endsWith(".ts") || entryPath.endsWith(".tsx")) {
    plugins.push("typescript");
  }
  if (entryPath.endsWith(".tsx") || entryPath.endsWith(".jsx")) {
    plugins.push("jsx");
  }

  let ast: t.File;

  try {
    ast = parse(fs.readFileSync(entryPath, "utf-8"), {
      plugins,
      sourceType: "module",
    });
  } catch (e) {
    console.error(chalk.red(`Failed to parse '${entryPath}'`));
    throw e;
  }

  const sdkImportMap = new Map();

  traverse(ast, {
    enter({ node }) {
      // First, collect sdk imports of each file.

      // Match import declarations, such as:
      // ```js
      //   import { ObjectApi } from "@next-sdk/cmdb-sdk";
      // ```
      if (t.isImportDeclaration(node) && t.isStringLiteral(node.source)) {
        const sourcePath = node.source.value;
        if (
          sourcePath.startsWith("@next-sdk/") ||
          sourcePath.startsWith("@sdk/")
        ) {
          for (const spec of node.specifiers) {
            if (
              t.isImportSpecifier(spec) &&
              t.isIdentifier(spec.imported) &&
              t.isIdentifier(spec.local) &&
              /Api$/.test(spec.imported.name)
            ) {
              const contract = [
                "easyops.api",
                snakeCase(sourcePath.split("/").pop().replace(/-sdk$/, "")),
                snakeCase(spec.imported.name.replace(/Api$/, "")),
              ].join(".");
              sdkImportMap.set(spec.local.name, contract);
            }
          }
        } else if (/^\.\.?(?:\/|$)/.test(sourcePath)) {
          // Collect sdk usages from relative imports.
          // Todo(steve): handle imports from `@next-libs/*`.
          let resolvedPath: string;
          try {
            resolvedPath = resolve.sync(sourcePath, {
              basedir: path.dirname(entryPath),
              extensions: [".ts", ".tsx", ".js", ".jsx"],
            });
          } catch (e) {
            console.error(
              chalk.red(`Failed to resolve '${sourcePath}' in '${entryPath}':`)
            );
            console.error(e);
          }
          if (resolvedPath) {
            collectContracts(resolvedPath, deps, memo);
          }
        }
      }

      // Second, collect sdk usages of each file.

      // Match member expressions, such as:
      // ```js
      //   ObjectApi.getDetail(...);
      // ```
      if (
        t.isMemberExpression(node) &&
        t.isIdentifier(node.object) &&
        sdkImportMap.has(node.object.name) &&
        t.isIdentifier(node.property)
      ) {
        deps.add(
          `${sdkImportMap.get(node.object.name)}.${pascalCase(
            node.property.name
          )}`
        );
      }
    },
  });
}
