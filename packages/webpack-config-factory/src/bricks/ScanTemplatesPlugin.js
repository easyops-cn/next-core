const pluginName = "ScanTemplatesPlugin";

module.exports = class ScanTemplatesPlugin {
  constructor(packageName) {
    this.packageName = packageName;
  }

  apply(compiler) {
    const templateSet = new Set();
    compiler.hooks.normalModuleFactory.tap(pluginName, factory => {
      factory.hooks.parser.for("javascript/auto").tap(pluginName, parser => {
        parser.hooks.statement.tap(pluginName, statement => {
          const { type, expression } = statement;
          if (
            type === "ExpressionStatement" &&
            expression.type === "CallExpression" &&
            expression.callee.type === "MemberExpression" &&
            expression.callee.property.name === "registerBrickTemplate" &&
            expression.arguments.length === 2
          ) {
            const { type, value } = expression.arguments[0];
            if (type === "Literal") {
              if (!value.startsWith(`${this.packageName}.`)) {
                throw new Error(
                  `Invalid template: "${value}", expecting prefixed with the package name: "${this.packageName}"`
                );
              }
              templateSet.add(value);
            } else {
              throw new Error(
                "Please call `getRuntime().registerBrickTemplate()` only with literal string"
              );
            }
          }
        });
      });
    });
    compiler.hooks.emit.tap(pluginName, compilation => {
      const templates = Array.from(templateSet);
      const source = JSON.stringify({ templates }, null, 2);
      compilation.assets["templates.json"] = {
        source: () => source,
        size: () => source.length
      };
      console.log("Defined templates:", templates);
    });
  }
};
