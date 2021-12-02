const path = require("path");
const fs = require("fs-extra");
const os = require("os");
const cp = require("child_process");
const chalk = require("chalk");
const _ = require("lodash");
const yaml = require("js-yaml");
const changeCase = require("change-case");
const { getEasyopsConfig } = require("@next-core/repo-config");

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "contract-center"));
const namespaceI18nMap = new Map();
const modelI18nMap = new Map();
const infoYaml = "info.yaml";

const clone = () => {
  console.log("git cloning ...");
  const { contractUrl } = getEasyopsConfig();
  const result = cp.spawnSync("git", ["clone", "-q", contractUrl, tmpDir]);
  return result;
};

const getContractDir = () => {
  const { contractYamlDir } = getEasyopsConfig();
  const easyopsYamlDir = path.join(tmpDir, contractYamlDir);
  const easyopsApiDir = path.join(easyopsYamlDir, "api");

  return { easyopsApiDir, easyopsYamlDir };
};

const getNamespace = (pluginName) => {
  const prefix = "providers-of-";
  return pluginName.substr(prefix.length).split(".")[0];
};

const getModule = (pluginName) => {
  const { easyopsApiDir } = getContractDir();
  const namespace = getNamespace(pluginName);
  const find = fs
    .readdirSync(easyopsApiDir, { withFileTypes: true })
    .find(
      (dirent) =>
        dirent.isDirectory() && changeCase.paramCase(dirent.name) === namespace
    );

  return find && find.name;
};

const getProviderData = (module, pluginName) => {
  const namespaceDir = path.join(getContractDir().easyopsApiDir, module);
  const providerDocs = [];

  if (fs.existsSync(path.join(namespaceDir, infoYaml))) {
    const i18nData = yaml.safeLoad(fs.readFileSync(namespaceDir, infoYaml));
    _.map(i18nData, (key, value) => {
      namespaceI18nMap.set(key, value);
    });
  }

  fs.readdirSync(namespaceDir, { withFileTypes: true }).forEach((dirent) => {
    if (!dirent.isDirectory()) {
      return;
    }

    const modelDir = path.join(namespaceDir, dirent.name);

    if (fs.existsSync(path.join(modelDir, infoYaml))) {
      const modelI18nData = yaml.safeLoad(fs.readFileSync(modelDir, infoYaml));
      _.map(modelI18nData, (key, value) => {
        modelI18nMap.set(key, value);
      });
    }

    fs.readdirSync(modelDir).forEach((file) => {
      const filePath = path.join(modelDir, file);
      const doc = yaml.safeLoad(fs.readFileSync(filePath, "utf8"));
      const categoryI18n = modelI18nMap.get("description");
      providerDocs.push({
        provider: `${pluginName}.${changeCase.paramCase(
          dirent.name
        )}-api-${changeCase.paramCase(doc.name)}`,
        category: categoryI18n,
        name: doc.name,
        version: doc.version,
        description: doc.description,
        detail: doc.detail,
        endpoint: doc.endpoint,
        import: doc.import,
        request: doc.request,
        response: doc.response,
        examples: doc.examples,
      });
    });
  });

  return providerDocs;
};

const writeDocs = (providerData, pluginName) => {
  const descriptionI18n = namespaceI18nMap.get("description");
  const docs = {
    name: pluginName,
    description: descriptionI18n,
    providers: providerData,
  };

  const docsPath = path.join(process.cwd(), "dist", "contract.json");
  const content = JSON.stringify(docs, null, 2);
  fs.writeFileSync(docsPath, content);
};

const generateDocs = (pluginName) => {
  const module = getModule(pluginName);

  if (!module) {
    throw new Error(
      `Can't find ${getNamespace(
        pluginName
      )} namespace, please check if the specified directory exists in the \`contract-center\` `
    );
  } else {
    const providerData = getProviderData(module, pluginName);
    writeDocs(providerData, pluginName);
    console.log(`contract docs for ${pluginName} generated.`);
  }
};

module.exports = function generateProviderDocsV2(pluginName) {
  const result = clone();
  if (result.status !== 0) {
    console.error(chalk.red("git clone failed"));
    console.error(result.stderr);
    process.exit(result.status);
  }

  generateDocs(pluginName);
};
