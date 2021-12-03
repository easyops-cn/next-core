const path = require("path");
const fs = require("fs-extra");
const chalk = require("chalk");
const changeCase = require("change-case");
const yaml = require("js-yaml");
const { omit } = require("lodash");

module.exports = function generateProviderDocsV2(pluginName) {
  let contractPath;
  const providersJson = require(path.resolve("providers.json"));
  try {
    contractPath = require.resolve(`${providersJson.sdk}/dist/contract.json`, {
      paths: [process.cwd()],
    });
  } catch (error) {
    console.log(
      chalk.yellow(
        `Warning: no contract.json file generated, if need it please execute \`yarn yo-sdk\` for ${providersJson.sdk} and build it later`
      )
    );
    return;
  }

  const doc = yaml.safeLoad(fs.readFileSync(contractPath), "utf-8");
  const contract = {
    ...omit(doc, ["name", "contracts"]),
    name: `providers-of-${changeCase.paramCase(doc.name)}`,
    providers: doc.contracts.map((item) => {
      const [service, model, name] = item.contract.split(".");
      return {
        provider: `providers-of-${changeCase.paramCase(
          service
        )}.${changeCase.paramCase(model)}-api-${changeCase.paramCase(name)}`,
        ...omit(item, "contract"),
      };
    }),
  };
  fs.writeFileSync(
    path.join(process.cwd(), "dist", "contract.json"),
    JSON.stringify(contract, null, 2)
  );
  console.log(`Providers contract for ${pluginName} generated.`);
};
