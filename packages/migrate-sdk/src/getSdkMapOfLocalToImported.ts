import traverse from "@babel/traverse";
import * as t from "@babel/types";

export function getSdkMapOfLocalToImported(
  ast: t.File
): {
  sdkMapOfLocalNameToImportedName: Map<string, string>;
  sdkNamespaceSet: Set<string>;
} {
  const sdkMapOfLocalNameToImportedName = new Map<string, string>();
  const sdkNamespaceSet = new Set<string>();

  traverse(ast, {
    ImportDeclaration({ node }) {
      // First, collect sdk imports of each file.

      // Match import declarations, such as:
      // ```js
      //   import { ObjectApi } from "@next-sdk/cmdb-sdk";
      // ```
      if (t.isStringLiteral(node.source)) {
        const sourcePath = node.source.value;
        if (
          (sourcePath.startsWith("@next-sdk/") ||
            sourcePath.startsWith("@sdk/")) &&
          sourcePath !== "@next-sdk/auth-sdk"
        ) {
          if (sourcePath.split("/").length > 2) {
            throw new Error(`Unexpected import from "${sourcePath}"`);
          }
          for (const spec of node.specifiers) {
            if (t.isImportNamespaceSpecifier(spec)) {
              sdkNamespaceSet.add(spec.local.name);
            } else if (
              t.isImportSpecifier(spec) &&
              t.isIdentifier(spec.imported) &&
              /Api$/.test(spec.imported.name) &&
              !spec.imported.name.includes("_")
            ) {
              sdkMapOfLocalNameToImportedName.set(
                spec.local.name,
                spec.imported.name
              );
            }
          }
        }
      }
    },
  });

  return { sdkMapOfLocalNameToImportedName, sdkNamespaceSet };
}
