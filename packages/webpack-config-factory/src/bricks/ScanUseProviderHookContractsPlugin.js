const pluginName = "ScanUseProviderHookContractsPlugin";
const changeCase = require("change-case");
const { ConcatSource } = require("webpack-sources");
const contractFileExtName = ".js.contracts";
const validSDKProviderName = /^(providers-of-)[a-z-\d]*\.[a-z-\d]*$/;
const validFlowApiProviderName =
  /^(easyops\.api\.)[a-zA-Z-_\d]*\.[a-zA-Z-_\d]*@[a-zA-Z-_\d]*:(\d+\.)?(\d+\.)?(\d+)$/;

function gatherContractComments({ provider, brickName, contractsEntries }) {
  let contract = "";

  // Flow Api Provider
  if (provider.includes("@")) {
    contract = provider.replace("@", ".").replace(":", "@");
  } else {
    // SDK API Provider
    const [namespace, apiFullName] = provider.split(".");
    const prefix = "providers-of-";
    const service = namespace.replace(prefix, "");
    const [model, apiName] = apiFullName.split("-api-");
    contract = `easyops.api.${changeCase.snakeCase(
      service
    )}.${changeCase.snakeCase(model)}.${changeCase.pascalCase(apiName)}`;
  }
  const comment = `/**! @contract ${contract} */`;
  const fileName = `${brickName}${contractFileExtName}`;
  const contracts = contractsEntries.get(fileName) || [];

  contractsEntries.set(fileName, [...contracts, comment]);
}

function collectExpression(expression, parser, contractsEntries, printWarning) {
  const data = [];
  if (expression?.type === "Literal") {
    data.push(expression.value);
  } else if (expression?.type === "ConditionalExpression") {
    // someVar.query(a ? "provider-a" : "provider-b") Or  useProvider(a ? "provider-a" : "provider-b")
    data.push(expression.consequent.value);
    data.push(expression.alternate.value);
  }

  if (data.length) {
    data.forEach((item) => {
      if (
        validSDKProviderName.test(item) ||
        validFlowApiProviderName.test(item)
      ) {
        const brickName = Object.keys(parser.state.options.entry)[0];
        gatherContractComments({
          provider: item,
          brickName,
          contractsEntries,
        });
      }
    });
    return;
  }

  printWarning &&
    console.warn(
      "[useProvider] Here it is recommended to use string or conditional expression as the provider name。"
    );
}

module.exports = class ScanUseProviderHookContractsPlugin {
  constructor(options = {}) {
    this.options = options;
  }

  apply(compiler) {
    const { printWarning } = this.options;
    const contractsEntries = new Map();

    compiler.hooks.normalModuleFactory.tap(pluginName, (factory) => {
      factory.hooks.parser.for("javascript/auto").tap(pluginName, (parser) => {
        parser.hooks.evaluate
          .for("CallExpression")
          .tap(pluginName, (expression) => {
            const { type, callee } = expression;
            // useProvider(...args)
            if (
              type === "CallExpression" &&
              callee.name === "useProvider" &&
              expression.arguments.length
            ) {
              collectExpression(
                expression.arguments[0],
                parser,
                contractsEntries,
                printWarning
              );
            }
          });

        parser.hooks.statement.tap(pluginName, (statement) => {
          const { type, expression } = statement;

          // someVar.query(...args)
          if (
            type === "ExpressionStatement" &&
            expression.type === "CallExpression" &&
            expression.callee.type === "MemberExpression" &&
            expression.callee.property.type === "Identifier" &&
            expression.callee.property.name === "query" &&
            expression.arguments.length
          ) {
            collectExpression(
              expression.arguments[0],
              parser,
              contractsEntries,
              printWarning
            );
          }
        });
      });
    });

    compiler.hooks.emit.tap(pluginName, (compilation) => {
      const assets = Object.keys(compilation.assets)
        .filter((filePath) => filePath.endsWith(".js.contracts"))
        .map((path) => [path, compilation.assets[path]]);
      const assetsEntries = new Map(assets);

      Array.from(contractsEntries.keys()).forEach((brickName) => {
        const content = assetsEntries.get(brickName) || "\n";
        const contractComments = [
          ...new Set([...contractsEntries.get(brickName)]),
        ];
        const source = new ConcatSource(content);

        contractComments.forEach((comment) => {
          source.add(comment);
          source.add("\n\n");
        });
        compilation.assets[brickName] = source;
      });
    });
  }
};
