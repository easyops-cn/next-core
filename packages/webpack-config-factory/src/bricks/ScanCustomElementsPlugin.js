const changeCase = require("change-case");

const pluginName = "ScanCustomElementsPlugin";

const legacyBrickNames = [
  "presentational-bricks.calendar",
  "workspace.container.shortcut-searchable-bar",
  "workspace.container.shortcut-searchable-list",
  "workspace.container.create-deploy-unit",
];
const validBrickName = /^[a-z][a-z0-9]*(-[a-z0-9]+)*\.[a-z][a-z0-9]*(-[a-z0-9]+)+$/;
const validProcessorName = /^[a-z][a-zA-Z0-9]*\.[a-z][a-zA-Z0-9]*$/;
const validEditorName = /^[a-z][a-z0-9]*(-[a-z0-9]+)*\.[a-z][a-z0-9]*(-[a-z0-9]+)+--editor$/;

module.exports = class ScanCustomElementsPlugin {
  constructor(packageName, dll = []) {
    this.packageName = packageName;
    this.camelPackageName = changeCase.camelCase(packageName);
    this.dll = dll;
  }

  apply(compiler) {
    const brickSet = new Set();
    const editorSet = new Set();
    const processorSet = new Set();
    compiler.hooks.normalModuleFactory.tap(pluginName, (factory) => {
      factory.hooks.parser.for("javascript/auto").tap(pluginName, (parser) => {
        parser.hooks.callAnyMember
          .for("customElements")
          .tap(pluginName, (expression) => {
            // `customElements.define(...)`
            if (
              expression.callee.property.name === "define" &&
              expression.arguments.length === 2
            ) {
              const { type, value } = expression.arguments[0];
              if (type === "Literal") {
                if (!value.startsWith(`${this.packageName}.`)) {
                  throw new Error(
                    `Invalid brick: "${value}", expecting prefixed with the package name: "${this.packageName}"`
                  );
                }

                if (validEditorName.test(value)) {
                  editorSet.add(value);
                } else if (
                  validBrickName.test(value) ||
                  legacyBrickNames.includes(value)
                ) {
                  brickSet.add(value);
                } else {
                  throw new Error(
                    `Invalid brick: "${value}", expecting: "PACKAGE-NAME.BRICK-NAME", where PACKAGE-NAME and BRICK-NAME must be lower-kebab-case, and BRICK-NAME must include a \`-\``
                  );
                }
              } else {
                throw new Error(
                  "Please call `customElements.define()` only with literal string"
                );
              }
            }
          });

        parser.hooks.statement.tap(pluginName, (statement) => {
          const { type, expression } = statement;

          // `getRuntime().registerCustomTemplate(...)`
          if (
            type === "ExpressionStatement" &&
            expression.type === "CallExpression" &&
            expression.callee.type === "MemberExpression" &&
            expression.callee.property.name === "registerCustomTemplate" &&
            expression.arguments.length === 2
          ) {
            const { type, value } = expression.arguments[0];
            if (type === "Literal") {
              if (!value.startsWith(`${this.packageName}.`)) {
                throw new Error(
                  `Invalid custom template: "${value}", expecting prefixed with the package name: "${this.packageName}"`
                );
              }
              brickSet.add(value);
            } else {
              throw new Error(
                "Please call `getRuntime().registerCustomTemplate()` only with literal string"
              );
            }
          }

          // `getRuntime().registerCustomProcessor(...)`
          if (
            type === "ExpressionStatement" &&
            expression.type === "CallExpression" &&
            expression.callee.type === "MemberExpression" &&
            expression.callee.property.name === "registerCustomProcessor" &&
            expression.arguments.length === 2
          ) {
            const { type, value } = expression.arguments[0];
            if (type === "Literal") {
              if (!value.startsWith(`${this.camelPackageName}.`)) {
                throw new Error(
                  `Invalid custom processor: "${value}", expecting prefixed with the camelCase package name: "${this.camelPackageName}"`
                );
              }

              if (!validProcessorName.test(value)) {
                throw new Error(
                  `Invalid custom processor: "${value}", expecting format of "camelPackageName.camelProcessorName"`
                );
              }
              processorSet.add(value);
            } else {
              throw new Error(
                "Please call `getRuntime().registerCustomProcessor()` only with literal string"
              );
            }
          }
        });
        parser.hooks.importSpecifier.tap(
          pluginName,
          (statement, source, exportName, identifierName) => {
            // Forbid usages such as `import Form from "antd/lib/form"`.
            // Because it could result in antd packed into the distributions.
            if (
              source.startsWith("antd/lib/") &&
              // Should never import *default* from `antd/lib/*`
              exportName === "default"
            ) {
              throw new Error(
                `Please do \`import { ${identifierName} } from "antd"\` instead of \`from "${source}"\``
              );
            }
          }
        );
      });
    });
    compiler.hooks.emit.tap(pluginName, (compilation) => {
      const bricks = Array.from(brickSet);
      const editors = Array.from(editorSet);
      const processors = Array.from(processorSet);

      const editorsAssetFilePath = Object.keys(compilation.assets).find(
        (filePath) =>
          filePath.startsWith("editors/editors.") && filePath.endsWith(".js")
      );
      const editorsJsFilePath =
        editorsAssetFilePath &&
        `bricks/${this.packageName}/dist/${editorsAssetFilePath}`;

      const source = JSON.stringify(
        { bricks, editors, editorsJsFilePath, processors, dll: this.dll },
        null,
        2
      );

      compilation.assets["bricks.json"] = {
        source: () => source,
        size: () => source.length,
      };
      console.log("Defined bricks:", bricks);
      console.log("Defined processors:", processors);
    });
  }
};
