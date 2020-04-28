const path = require("path");
const os = require("os");
const fs = require("fs-extra");
const changeCase = require("change-case");
const prettier = require("prettier");

const generateProviderElements = () => {
  const providersJson = require(path.join(process.cwd(), "providers.json"));

  const providersPackage = require(path.join(process.cwd(), "package.json"));
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
  const easyopsConfig = fs.existsSync(path.join(process.cwd(), ".easyops-yo.json")) && fs.readJsonSync(path.join(process.cwd(), ".easyops-yo.json"))
  const content = `import { createProviderClass } from "@easyops/brick-utils";
    import { ${Array.from(groupSet).join(",")} } from "${!easyopsConfig.getSdkFromNextSdkRepo ? '../../../'+providersJson.sdk:providersJson.sdk}";

    ${defines.join(os.EOL)}`;
    path.join(__dirname)

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
