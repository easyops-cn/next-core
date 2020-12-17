const changeCase = require("change-case");

const pluginName = "ScanEditorBricksPlugin";

const validEditorName = /^[a-z][a-z0-9]*(-[a-z0-9]+)*\.[a-z][a-z0-9]*(-[a-z0-9]+)+--editor$/;

module.exports = class ScanEditorBricksPlugin {
  constructor(packageName) {
    this.packageName = packageName;
    this.camelPackageName = changeCase.camelCase(packageName);
  }

  apply(compiler) {
    const editorSet = new Set();
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
                    `Invalid editor brick: "${value}", expecting prefixed with the package name: "${this.packageName}"`
                  );
                }

                if (validEditorName.test(value)) {
                  editorSet.add(value);
                } else {
                  throw new Error(
                    `Invalid editor brick: "${value}", expecting: "PACKAGE-NAME.BRICK-NAME--editor", where PACKAGE-NAME and BRICK-NAME must be lower-kebab-case, and BRICK-NAME must include a \`-\``
                  );
                }
              } else {
                throw new Error(
                  "Please call `customElements.define()` only with literal string"
                );
              }
            }
          });
      });
    });
    compiler.hooks.emit.tap(pluginName, (compilation) => {
      const editors = Array.from(editorSet);

      const editorsAssetFilePath = Object.keys(compilation.assets).find(
        (filePath) =>
          filePath.startsWith("editors.") && filePath.endsWith(".js")
      );
      const editorsJsFilePath =
        editorsAssetFilePath &&
        `bricks/${this.packageName}/dist/editors/${editorsAssetFilePath}`;

      const source = JSON.stringify({ editors, editorsJsFilePath }, null, 2);

      compilation.assets["editors.json"] = {
        source: () => source,
        size: () => source.length,
      };
      console.log("Defined editor bricks:", editors);
    });
  }
};
