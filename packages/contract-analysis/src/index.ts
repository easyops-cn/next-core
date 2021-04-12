import path from "path";
import fs from "fs-extra";
import { snakeCase, pascalCase } from "change-case";
import { parse } from "@babel/parser";
import * as t from "@babel/types";
import traverse from "@babel/traverse";

export function getContractDepsByBrick(cwd: string): Map<string, Set<string>> {
  const brickEntries = fs.readJsonSync(
    path.join(cwd, "dist/brick-entries.json")
  ) as Record<string, string>;

  const brickContractDeps = new Map<string, Set<string>>();

  for (const [brick, relativePath] of Object.entries(brickEntries)) {
    if (!brick.includes("provider-")) {
      continue;
    }
    const entry = path.join(cwd, relativePath);
    const ast = parse(fs.readFileSync(entry, "utf-8"), {
      plugins: [/* "estree",  */ "typescript", "jsx"],
      sourceType: "module",
    });
    console.log("brick:", brick);

    const sdkImportMap = new Map();

    traverse(ast, {
      enter({ node }) {
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
          }
        }

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
          let deps = brickContractDeps.get(brick);
          if (!deps) {
            deps = new Set<string>();
            brickContractDeps.set(brick, deps);
          }
          deps.add(
            `${sdkImportMap.get(node.object.name)}.${pascalCase(
              node.property.name
            )}`
          );
        }
      },
    });
  }

  return brickContractDeps;
}
