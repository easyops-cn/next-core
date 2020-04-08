const path = require("path");
const fs = require("fs-extra");
const semver = require("semver");
const { chain, pull, escapeRegExp } = require("lodash");
const { writeJsonFile, readJson, readSelfJson } = require("./utils");

module.exports = function patch() {
  const selfJson = readSelfJson();
  const rootPackageJsonPath = path.resolve("package.json");
  const rootPackageJson = readJson(rootPackageJsonPath);
  if (!rootPackageJson.easyops) {
    rootPackageJson.easyops = {};
  }
  if (!rootPackageJson.easyops["dev-dependencies"]) {
    rootPackageJson.easyops["dev-dependencies"] = "0.3.2";
  }
  const currentRenewVersion = rootPackageJson.easyops["dev-dependencies"];

  if (semver.lt(currentRenewVersion, "0.4.0")) {
    updateLintstagedrc();
  }

  if (semver.lt(currentRenewVersion, "0.5.0")) {
    moveBricksDeployFiles();
  }

  if (semver.lt(currentRenewVersion, "0.6.0")) {
    updateJsdom();
  }

  rootPackageJson.easyops["dev-dependencies"] = selfJson.version;

  writeJsonFile(rootPackageJsonPath, rootPackageJson);
};

function updateLintstagedrc() {
  const filePath = path.resolve(".lintstagedrc");
  if (fs.existsSync(filePath)) {
    const lintstagedrc = readJson(filePath);
    writeJsonFile(
      filePath,
      chain(lintstagedrc)
        .toPairs()
        .map(([key, value]) => {
          if (Array.isArray(value)) {
            // https://github.com/okonet/lint-staged/releases/tag/v10.0.0
            pull(value, "git add");
            if (value.length === 1) {
              value = value[0];
            }
          }
          return [key, value];
        })
        .fromPairs()
        .value()
    );
  }
}

// Move `bricks/*/deploy/package.conf.yaml` to `bricks/*/deploy-default/package.conf.yaml`.
// For managing dependencies of custom templates.
function moveBricksDeployFiles() {
  const gitignoreFilePath = path.resolve(".gitignore");
  const gitignoreContent = fs.readFileSync(gitignoreFilePath, "utf8");
  const needClear = new RegExp(
    escapeRegExp("!/bricks/*/deploy/package.conf.yaml") + "[\\r\\n]*"
  );
  if (needClear.test(gitignoreContent)) {
    fs.writeFileSync(
      gitignoreFilePath,
      gitignoreContent.replace(needClear, "")
    );
  }

  const bricksDir = path.resolve("bricks");
  if (!fs.existsSync(bricksDir)) {
    return;
  }

  fs.readdirSync(bricksDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .forEach((dirent) => {
      const fileInDeployDir = path.join(
        bricksDir,
        dirent.name,
        "deploy/package.conf.yaml"
      );
      const fileInDeployDefaultDir = path.join(
        bricksDir,
        dirent.name,
        "deploy-default/package.conf.yaml"
      );
      if (
        !fs.existsSync(fileInDeployDir) ||
        fs.existsSync(fileInDeployDefaultDir)
      ) {
        return;
      }
      fs.copySync(fileInDeployDir, fileInDeployDefaultDir);
      fs.removeSync(path.dirname(fileInDeployDir));
    });
}

// We remove the unnecessary code of `document-register-element`
// since jsdom@16.2.0 started support custom elements.
// Ref https://github.com/jsdom/jsdom/releases/tag/16.2.0
function updateJsdom() {
  const filePath = path.resolve("jest.config.js");
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, "utf8");
    let updated = false;
    if (content.includes("jest-environment-jsdom-fourteen")) {
      content = content.replace(
        "jest-environment-jsdom-fourteen",
        "jest-environment-jsdom-sixteen"
      );
      updated = true;
    } else if (content.includes("jest-environment-jsdom-fifteen")) {
      content = content.replace(
        "jest-environment-jsdom-fifteen",
        "jest-environment-jsdom-sixteen"
      );
      updated = true;
    }
    if (updated) {
      fs.writeFileSync(filePath, content);
    }
  }

  const bricksDir = path.resolve("bricks");
  if (!fs.existsSync(bricksDir)) {
    return;
  }

  fs.readdirSync(bricksDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .forEach((dirent) => {
      const srcDir = path.join(bricksDir, dirent.name, "src");
      if (fs.statSync(srcDir).isDirectory()) {
        removeUnnecessaryCode(srcDir);
      }
    });

  function removeUnnecessaryCode(dir) {
    fs.readdirSync(dir, { withFileTypes: true }).forEach((dirent) => {
      const direntFilePath = path.join(dir, dirent.name);
      if (dirent.isDirectory()) {
        removeUnnecessaryCode(direntFilePath);
      } else if (
        (dirent.isFile() && dirent.name.endsWith(".spec.ts")) ||
        dirent.name.endsWith(".spec.tsx")
      ) {
        const content = fs.readFileSync(direntFilePath, "utf8");
        const needClear = new RegExp(
          "(?:" +
            escapeRegExp("// Ref https://github.com/jsdom/jsdom/issues/1030") +
            "[\\r\\n]*)?" +
            escapeRegExp('import "document-register-element";') +
            "[\\r\\n]*"
        );
        if (needClear.test(content)) {
          fs.writeFileSync(direntFilePath, content.replace(needClear, ""));
        }
      }
    });
  }
}
