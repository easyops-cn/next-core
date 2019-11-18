const pluginName = "ScanCustomElementsPlugin";

// Todo(steve): rename them and make breaking changes.
const legacyInvalidBricks = [
  "app-deploy-statistics-providers.business-app-tree",
  "app-deploy-statistics-providers.deploy-task-statistics",
  "ci-providers.get-build-list",
  "ci-providers.get-project-detail",
  "app-deploy.deploy-detail-provider",
  "app-deploy.source-panel",
  "app-deploy.create-resource",
  "app-deploy.delete-resource",
  "app-deploy.resource-basic-profile",
  "app-deploy.resource-operator",
  "app-deploy.initialize-deployment-modal",
  "app-deploy.deployment-detail-card",
  "app-deploy.initialize-service-modal",
  "app-deploy.port-settings",
  "app-deploy.advanced-settings",
  "app-deploy.service-detail-card",
  "mysql-resource-providers.add-service-nodes",
  "providers-of-search.get-history",
  "providers-of-search.push-history",
  "providers-of-search.clear-history",
  "providers-of-search.fulltext-search"
];

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
                if (
                  !value.startsWith(`${this.packageName}.`) &&
                  !legacyInvalidBricks.includes(value)
                ) {
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
