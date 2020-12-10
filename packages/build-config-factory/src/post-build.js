const path = require("path");
const yaml = require("js-yaml");
const fs = require("fs-extra");
const klawSync = require("klaw-sync");
const generateDeps = require("./generateDeps");
const ensureMicroApp = require("./ensureMicroApp");
const ensureDeps = require("./ensureDeps");
const validateDeps = require("./validateDeps");
const generateProviderDocs = require("./generateProviderDocs");
const generateBrickDocs = require("./generateBrickDocs");
const { providerPackagePrefix } = require("./constants");

const generateContracts = () => {
  const { dependencies } = require(path.join(process.cwd(), "package.json"));

  if (dependencies) {
    const contracts = Object.keys(dependencies)
      .filter((dep) => dep.startsWith("@sdk/"))
      .reduce((acc, dep) => {
        try {
          const contracts = yaml.safeLoad(
            fs.readFileSync(require.resolve(`${dep}/deploy/contracts.yaml`))
          );
          if (Array.isArray(contracts.depend_contracts)) {
            acc.push(...contracts.depend_contracts);
          }
        } catch (e) {
          console.error(e);
        }
        return acc;
      }, []);

    const content = yaml.safeDump({
      depend_contracts: contracts,
    });

    const filePath = path.join(process.cwd(), "deploy", "contracts.yaml");
    fs.outputFileSync(filePath, content);
  }
};

const ignores = [".DS_Store"];
const filter = (src) => ignores.some((item) => !src.includes(item));

function escapeRegExp(str) {
  return str.replace(/([.*+?^=!:${}()|[\]/\\])/g, "\\$1");
}

function replaceAll(str, find, replace) {
  return str.replace(new RegExp(escapeRegExp(find), "g"), replace);
}

function replaceFileContent(filePath, translations) {
  const content = fs.readFileSync(filePath, "utf8");
  const contentFinds = Object.keys(translations).filter((key) =>
    content.includes(key)
  );
  if (contentFinds.length > 0) {
    return contentFinds.reduce(
      (acc, find) => replaceAll(acc, find, translations[find]),
      content
    );
  }
  return content;
}

const writeToFile = (scope, pluginName, templateDir, targetDir) => {
  let dir;
  let suffix;
  if (scope === "micro-apps") {
    dir = "applications";
    suffix = "NA";
  } else if (scope === "templates") {
    dir = "templates";
    suffix = "NT";
  } else if (scope === "bricks") {
    dir = "bricks";
    suffix = "NB";
  } else {
    throw new Error(`Unknown scope: ${scope}`);
  }

  const translations = {
    "$install-path-dir$": dir,
    "$scope-name$": scope,
    "$package-name$": pluginName,
    "$suffix-name$": suffix,
  };

  const templateGroups = [
    {
      templateDir,
      targetDir,
      files: klawSync(templateDir, {
        depthLimit: 1,
        nodir: true,
        filter: (item) => filter(item.path),
      }),
    },
  ];

  const files = templateGroups.reduce(
    (acc, group) =>
      acc.concat(
        group.files.map((file) => {
          const content = replaceFileContent(file.path, translations);

          let realPath = file.path;
          const basename = path.basename(file.path);
          const filenameFinds = Object.keys(translations).filter((key) =>
            basename.includes(key)
          );
          if (filenameFinds.length > 0) {
            realPath = path.join(
              path.dirname(realPath),
              filenameFinds.reduce(
                (acc, find) => replaceAll(acc, find, translations[find]),
                basename
              )
            );
          }

          return [
            path.join(
              group.targetDir,
              path.relative(group.templateDir, realPath)
            ),
            content,
          ];
        })
      ),
    []
  );

  for (const [filePath, content] of files) {
    fs.outputFileSync(filePath, content);
  }
};

const generate = (scope, pluginName, templateRoot, dir) => {
  const templateDir = path.join(templateRoot, dir);
  const targetDir = path.join(process.cwd(), dir);
  writeToFile(scope, pluginName, templateDir, targetDir);
};

const generatePkgbuild = (scope, pluginName, templateRoot) => {
  generate(scope, pluginName, templateRoot, ".pkgbuild");
};

const generateDeploy = (scope, pluginName, templateRoot) => {
  generate(scope, pluginName, templateRoot, "deploy");
};

/**
 * Building of normal bricks and editor bricks are separated,
 * their assets are also separated. So we merge them during
 * post-building. This includes three steps:
 *
 * 1. Merge `dist-editors/editors.json` into `dist/bricks.json`.
 * 2. Copy `dist-editors/*` to `dist/editors/` (except `editors.json`).
 * 3. Remove `dist-editors`.
 */
const mergeEditors = () => {
  const brickDir = process.cwd();
  const distEditorsDir = path.join(brickDir, "dist-editors");
  const distEditorsJsonPath = path.join(distEditorsDir, "editors.json");
  if (fs.existsSync(distEditorsJsonPath)) {
    const distDir = path.join(brickDir, "dist");
    const bricksJsonPath = path.join(distDir, "bricks.json");
    const bricksJson = fs.readJsonSync(bricksJsonPath);
    fs.writeJsonSync(
      bricksJsonPath,
      {
        ...bricksJson,
        ...fs.readJsonSync(distEditorsJsonPath),
      },
      {
        spaces: 2,
      }
    );
    fs.copySync(distEditorsDir, path.join(distDir, "editors"), {
      filter: (src) => {
        return !src.endsWith("editors.json");
      },
    });
    fs.removeSync(distEditorsDir);
  }
};

module.exports = (scope) => {
  const cwd = process.cwd();
  const pluginName = path.basename(cwd);
  const templateRoot = path.join(__dirname, "../template");
  const enableGenerateDoc = process.env.ENABLE_GENERATE_DOC || false;
  generatePkgbuild(scope, pluginName, templateRoot);
  generateDeploy(scope, pluginName, templateRoot);
  validateDeps(scope);

  if (scope === "bricks") {
    generateContracts();
    if (pluginName.startsWith(providerPackagePrefix)) {
      generateProviderDocs(pluginName);
    } else {
      enableGenerateDoc && generateBrickDocs(pluginName, scope);
    }
    generateDeps();
    mergeEditors();
  } else if (scope === "micro-apps") {
    ensureMicroApp();
    ensureDeps();
    generateDeps();
  } else if (scope === "templates") {
    generateDeps();
  }
};
