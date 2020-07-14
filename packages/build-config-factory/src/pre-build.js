const path = require("path");
const os = require("os");
const fs = require("fs-extra");
const changeCase = require("change-case");
const prettier = require("prettier");

const findDuplicatesProvider = (providers) => {
  const sortedProviders = providers.slice().sort();
  const results = [];
  for (let i = 0; i < sortedProviders.length - 1; i++) {
    if (sortedProviders[i + 1] === sortedProviders[i]) {
      results.push(sortedProviders[i]);
    }
  }
  return results;
};

const generateProviderElements = () => {
  const providersJson = require(path.join(process.cwd(), "providers.json"));
  const providersPackage = require(path.join(process.cwd(), "package.json"));
  const duplicatesProvider = findDuplicatesProvider(providersJson.providers);
  if (duplicatesProvider.length > 0) {
    throw new Error(
      `The duplicate providers are ${duplicatesProvider
        .map((provider) => `"${provider}"`)
        .join("，")}. please recheck.`
    );
  }

  const packageName = providersPackage.name.split("/")[1];

  const defines = [];
  const groupSet = new Set();
  for (const api of providersJson.providers) {
    const [groupName, apiName] = api.split(".");
    groupSet.add(groupName);
    defines.push(
      `customElements.define(
        "${packageName}.${changeCase.paramCase(
        groupName
      )}-${changeCase.paramCase(apiName)}",
        createProviderClass(${groupName}.${apiName})
      );`
    );
  }
  const importPath = providersJson.sdk;

  const content = `import { createProviderClass } from "@easyops/brick-utils";
    import { ${Array.from(groupSet).join(",")} } from "${importPath}";

    ${defines.join(os.EOL)}`;

  const indexTsPath = path.join(process.cwd(), "src/index.ts");
  fs.outputFileSync(
    indexTsPath,
    prettier.format(content, { parser: "typescript" })
  );
  console.log("File created:", path.relative(process.cwd(), indexTsPath));
};

module.exports = (scope = "micro-apps") => {
  if (scope === "providers") {
    generateProviderElements();
  }
};
