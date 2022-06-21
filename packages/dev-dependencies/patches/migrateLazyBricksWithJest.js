const path = require("path");
const fs = require("fs");
const generator = require("@babel/generator");
const { parse } = require("@babel/parser");
const traverse = require("@babel/traverse");
const t = require("@babel/types");
const prettier = require("prettier");

function compiler(code) {
  const ast = parse(code);
  const visitor = {
    CallExpression(path) {
      const { callee, arguments: _arguments } = path.node;
      const isJestConfigFactoryFn = callee.name === "jestConfigFactory";
      const hasMoreArguments = _arguments.length > 0;

      if (!isJestConfigFactoryFn) return;
      if (!hasMoreArguments) return;
      _arguments.forEach((objExp) => {
        if (t.isObjectExpression(objExp)) {
          const properties = objExp?.properties;
          let i = -1;
          properties.forEach((prop, idx) => {
            if (prop.key.name !== "moduleNameMapper") return;
            if (t.isObjectProperty(prop)) {
              const args = prop.value.properties;
              const hasMoreArgsOfModuleNameMapper = args.length > 1;
              const lazyBricksCursor = args.findIndex(
                (prop) =>
                  prop.key.type === "StringLiteral" &&
                  prop.key.value === "^\\./lazy-bricks$"
              );

              if (lazyBricksCursor > -1) {
                if (hasMoreArgsOfModuleNameMapper) {
                  args.splice(lazyBricksCursor, 1);
                } else {
                  prop.value.properties = [];
                }
              }
            }

            if (!prop.value.properties?.length) {
              i = idx;
            }
          });
          if (i > -1) {
            properties.splice(i, 1);
          }
        }
      });

      if (_arguments?.length === 1 && _arguments[0].properties?.length === 0) {
        path.node.arguments = [];
      }
    },
  };

  traverse.default(ast, visitor);
  return generator.default(ast, {}, code).code;
}
async function migrateLazyBricksWithJest() {
  const jestConfigJs = path.resolve("jest.config.js");
  const jestConfig = fs.readFileSync(jestConfigJs, "utf-8");

  const code = compiler(jestConfig);

  fs.writeFileSync(
    jestConfigJs,
    prettier.format(code, { parser: "typescript" })
  );
}
module.exports = migrateLazyBricksWithJest;
