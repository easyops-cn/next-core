const pluginName = "ScanTemplatesPlugin";

module.exports = class ScanTemplatesPlugin {
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
            if (expression.arguments[0].type === "Literal") {
              templateSet.add(expression.arguments[0].value);
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
