const pluginName = "ScanCustomElementsPlugin";

module.exports = class ScanCustomElementsPlugin {
  constructor(packageName, dll = []) {
    this.packageName = packageName;
    this.dll = dll;
  }

  apply(compiler) {
    const brickSet = new Set();
    compiler.hooks.normalModuleFactory.tap(pluginName, factory => {
      factory.hooks.parser.for("javascript/auto").tap(pluginName, parser => {
        parser.hooks.callAnyMember
          .for("customElements")
          .tap(pluginName, expression => {
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
                brickSet.add(value);
              } else {
                throw new Error(
                  "Please call `customElements.define()` only with literal string"
                );
              }
            }
          });
      });
    });
    compiler.hooks.emit.tap(pluginName, compilation => {
      const bricks = Array.from(brickSet);
      const source = JSON.stringify({ bricks, dll: this.dll }, null, 2);
      compilation.assets["bricks.json"] = {
        source: () => source,
        size: () => source.length
      };
      console.log("Defined bricks:", bricks);
    });
  }
};
