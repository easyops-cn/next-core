const fs = require("fs");
const path = require("path");
const { parse } = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const { glob } = require("glob");

/**
 * 扫描包中的所有构件依赖（支持按导出成员分组）
 * @param {string} packageDir - 包的根目录
 * @returns {{ all: string[], byExport: Record<string, string[]> }}
 */
function scanBrickDependencies(packageDir) {
  const srcDir = path.join(packageDir, "src");
  const allBrickDeps = new Set();
  const brickDepsByExport = {}; // 按导出成员分组

  // 查找所有源文件（支持 ts, tsx, js, jsx）
  const files = glob.sync("**/*.{ts,tsx,js,jsx}", {
    cwd: srcDir,
    absolute: true,
    ignore: ["**/*.spec.*", "**/*.test.*", "**/__tests__/**"],
  });

  // 第一轮：收集每个文件中的 wrapBrick 调用
  const fileWrapBricks = new Map(); // filePath -> Set<brickName>

  for (const filePath of files) {
    try {
      const code = fs.readFileSync(filePath, "utf8");
      const ast = parse(code, {
        sourceType: "module",
        plugins: ["typescript", "jsx", "decorators-legacy"],
      });

      const bricks = new Set();

      // 遍历 AST 查找 wrapBrick/unwrapProvider 调用
      traverse(ast, {
        CallExpression(path) {
          const { callee, arguments: args } = path.node;

          if (
            callee.type === "Identifier" &&
            (callee.name === "wrapBrick" || callee.name === "unwrapProvider") &&
            args.length >= 1 &&
            args[0].type === "StringLiteral"
          ) {
            bricks.add(args[0].value);
            allBrickDeps.add(args[0].value);
          }
        },
      });

      if (bricks.size > 0) {
        fileWrapBricks.set(filePath, bricks);
      }
    } catch (error) {
      console.warn(`警告: 无法解析文件 ${filePath}:`, error.message);
    }
  }

  // 第二轮：分析入口文件的导出，建立导出成员与依赖的映射
  const entryFile = path.join(srcDir, "index.ts");
  const entryFileAlt = path.join(srcDir, "index.tsx");
  const entryFileJs = path.join(srcDir, "index.js");
  const entryFileJsx = path.join(srcDir, "index.jsx");
  const entryFilePath = fs.existsSync(entryFile)
    ? entryFile
    : fs.existsSync(entryFileAlt)
      ? entryFileAlt
      : fs.existsSync(entryFileJs)
        ? entryFileJs
        : fs.existsSync(entryFileJsx)
          ? entryFileJsx
          : null;

  if (entryFilePath) {
    try {
      const code = fs.readFileSync(entryFilePath, "utf8");
      const ast = parse(code, {
        sourceType: "module",
        plugins: ["typescript", "jsx", "decorators-legacy"],
      });

      // 构建导入映射：本地导入 -> 文件路径
      const importMap = new Map(); // localName -> filePath

      traverse(ast, {
        ImportDeclaration(path) {
          const source = path.node.source.value;
          if (!source.startsWith(".")) return;

          const importedFilePath = resolveImportPath(entryFilePath, source);
          for (const specifier of path.node.specifiers) {
            if (specifier.type === "ImportSpecifier") {
              const localName = specifier.local.name;
              importMap.set(localName, importedFilePath);
            } else if (specifier.type === "ImportDefaultSpecifier") {
              const localName = specifier.local.name;
              importMap.set(localName, importedFilePath);
            }
          }
        },
      });

      // 分析导出声明
      traverse(ast, {
        ExportNamedDeclaration(path) {
          const declaration = path.node.declaration;
          const source = path.node.source;

          if (source) {
            // export { foo } from "./other"
            const importedFilePath = resolveImportPath(
              entryFilePath,
              source.value
            );
            for (const specifier of path.node.specifiers) {
              // 处理字符串导出名：export { "some-name" as alias } from "..."
              const exportName =
                specifier.exported.type === "StringLiteral"
                  ? specifier.exported.value
                  : specifier.exported.name;
              brickDepsByExport[exportName] = [
                ...new Set(fileWrapBricks.get(importedFilePath) || []),
              ];
            }
          } else if (declaration) {
            // export const foo = ...
            // export function foo() { ... }
            if (declaration.type === "VariableDeclaration") {
              for (const declarator of declaration.declarations) {
                // 跳过解构声明（如 export const { foo } = ...）
                if (declarator.id.type !== "Identifier") {
                  continue;
                }

                const exportName = declarator.id.name;
                // 分析声明中的 wrapBrick 调用
                const deps = new Set();
                traverse(
                  declarator,
                  {
                    CallExpression(path) {
                      const { callee, arguments: args } = path.node;
                      if (
                        callee.type === "Identifier" &&
                        (callee.name === "wrapBrick" ||
                          callee.name === "unwrapProvider") &&
                        args.length >= 1 &&
                        args[0].type === "StringLiteral"
                      ) {
                        deps.add(args[0].value);
                      }
                    },
                    Identifier(path) {
                      // 检查是否引用了其他导入的函数
                      // 只处理调用表达式的 callee，避免匹配所有标识符
                      if (
                        path.parent.type !== "CallExpression" ||
                        path.parent.callee !== path.node
                      ) {
                        return;
                      }
                      const name = path.node.name;
                      if (importMap.has(name)) {
                        const refFilePath = importMap.get(name);
                        const refBricks = fileWrapBricks.get(refFilePath) || [];
                        refBricks.forEach((brick) => deps.add(brick));
                      }
                    },
                  },
                  path.scope
                );
                if (deps.size > 0) {
                  brickDepsByExport[exportName] = [...deps];
                }
              }
            } else if (declaration.type === "FunctionDeclaration") {
              const exportName = declaration.id?.name;
              if (exportName) {
                // 分析函数体中的 wrapBrick 调用
                const deps = new Set();
                traverse(
                  declaration,
                  {
                    CallExpression(path) {
                      const { callee, arguments: args } = path.node;
                      if (
                        callee.type === "Identifier" &&
                        (callee.name === "wrapBrick" ||
                          callee.name === "unwrapProvider") &&
                        args.length >= 1 &&
                        args[0].type === "StringLiteral"
                      ) {
                        deps.add(args[0].value);
                      }
                    },
                  },
                  path.scope
                );
                if (deps.size > 0) {
                  brickDepsByExport[exportName] = [...deps];
                }
              }
            }
          }
        },

        ExportDefaultDeclaration(path) {
          // export default ...
          const deps = new Set();
          traverse(
            path.node.declaration,
            {
              CallExpression(path) {
                const { callee, arguments: args } = path.node;
                if (
                  callee.type === "Identifier" &&
                  (callee.name === "wrapBrick" ||
                    callee.name === "unwrapProvider") &&
                  args.length >= 1 &&
                  args[0].type === "StringLiteral"
                ) {
                  deps.add(args[0].value);
                }
              },
            },
            path.scope
          );
          if (deps.size > 0) {
            brickDepsByExport["default"] = [...deps];
          }
        },
      });
    } catch (error) {
      console.warn(`警告: 无法分析入口文件 ${entryFilePath}:`, error.message);
    }
  }

  return {
    all: Array.from(allBrickDeps).sort(),
    byExport: brickDepsByExport,
  };
}

/**
 * 解析相对导入路径
 */
function resolveImportPath(fromFile, importPath) {
  const dir = path.dirname(fromFile);
  const resolved = path.join(dir, importPath);

  // 尝试添加扩展名
  for (const ext of [".ts", ".tsx", ".js", ".jsx"]) {
    if (fs.existsSync(resolved + ext)) {
      return resolved + ext;
    }
  }

  // 尝试 index 文件
  for (const indexName of ["index.ts", "index.tsx", "index.js", "index.jsx"]) {
    const indexPath = path.join(resolved, indexName);
    if (fs.existsSync(indexPath)) {
      return indexPath;
    }
  }

  return resolved;
}

/**
 * 生成并写入依赖清单文件
 * @param {string} packageDir - 包的根目录
 * @param {string} outputDir - 输出目录（通常是 dist）
 */
function generateDependencyManifest(packageDir, outputDir) {
  const { all, byExport } = scanBrickDependencies(packageDir);

  // 如果没有依赖，不生成清单文件
  if (all.length === 0) {
    return null;
  }

  const packageJsonPath = path.join(packageDir, "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

  const manifest = {
    // 包的基本信息
    name: packageJson.name,
    version: packageJson.version,

    // 全量构件依赖列表
    brickDependencies: all,

    // 按导出成员分组的构件依赖
    brickDependenciesByExport: byExport,

    // 生成时间戳（用于调试）
    generatedAt: new Date().toISOString(),
  };

  const manifestPath = path.join(outputDir, "brick-dependencies.json");
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  console.log(
    `✓ 生成构件依赖清单: ${all.length} 个依赖（${
      Object.keys(byExport).length
    } 个导出成员）-> ${manifestPath}`
  );

  return manifest;
}

module.exports = {
  scanBrickDependencies,
  generateDependencyManifest,
};
