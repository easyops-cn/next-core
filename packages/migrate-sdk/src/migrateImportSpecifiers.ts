import generate from "@babel/generator";
import traverse from "@babel/traverse";
import * as t from "@babel/types";

export function migrateImportSpecifiers(
  source: string,
  ast: t.File,
  migrateMapOfImportSpecifierToApiSet: Map<string, Set<string>>,
  migrateMapOfImportNamespaceSpecifierToApiSet: Map<string, Set<string>>
): string {
  if (
    migrateMapOfImportSpecifierToApiSet.size > 0 ||
    migrateMapOfImportNamespaceSpecifierToApiSet.size > 0
  ) {
    const replacements = new Set<t.ImportDeclaration>();

    traverse(ast, {
      // Match import specifiers, such as:
      // ```ts
      //   import { ObjectApi } from "@next-sdk/cmdb-sdk";
      //            ^^^^^^^^^
      // ```
      ImportSpecifier(path) {
        const { node, parent } = path;
        let apiSet: Set<string>;
        if (
          t.isImportDeclaration(parent) &&
          isImportFromSdk(parent) &&
          t.isIdentifier(node.imported) &&
          (apiSet = migrateMapOfImportSpecifierToApiSet.get(
            `${node.local.name}:${node.imported.name}`
          ))
        ) {
          const importedName = node.imported.name;
          path.replaceWithMultiple(
            Array.from(apiSet).map((api) =>
              t.importSpecifier(
                t.identifier(`${importedName}_${api}`),
                t.identifier(`${importedName}_${api}`)
              )
            )
          );
          replacements.add(parent);
        }
      },
      // Match import namespace specifiers, such as:
      // ```ts
      //   import * as sdk from "@next-sdk/cmdb-sdk";
      //          ^^^^^^^^
      // ```
      ImportNamespaceSpecifier(path) {
        const { node, parent } = path;
        let apiSet: Set<string>;
        if (
          t.isImportDeclaration(parent) &&
          isImportFromSdk(parent) &&
          (apiSet = migrateMapOfImportNamespaceSpecifierToApiSet.get(
            node.local.name
          ))
        ) {
          path.replaceWithMultiple(
            Array.from(apiSet).map((api) =>
              t.importSpecifier(t.identifier(api), t.identifier(api))
            )
          );
          replacements.add(parent);
        }
      },
    });

    if (replacements.size > 0) {
      // Only replace these migrated imports, to avoid accidentally
      // modify other parts of code during babel generating.
      const newSourcePartial: string[] = [];
      let cursor = 0;
      for (const node of replacements) {
        newSourcePartial.push(source.substring(cursor, node.start));
        newSourcePartial.push(generate(node).code);
        cursor = node.end;
      }
      newSourcePartial.push(source.substring(cursor));
      return newSourcePartial.join("");
    }
  }

  return source;
}

function isImportFromSdk(node: t.ImportDeclaration): boolean {
  const sourcePath = node.source.value;
  return (
    (sourcePath.startsWith("@next-sdk/") || sourcePath.startsWith("@sdk/")) &&
    sourcePath !== "@next-sdk/auth-sdk"
  );
}
