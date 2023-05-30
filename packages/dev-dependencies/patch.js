const path = require("path");
const os = require("os");
const fs = require("fs-extra");
const semver = require("semver");
const { chain, pull, escapeRegExp } = require("lodash");
const { writeJsonFile, readJson, readSelfJson } = require("./utils");
const {
  majorBrickNext,
  updateLernaAllowBranch,
  updateMRTemplates,
  updateBrickNextForNewCssVariables,
  updateBuildStories,
  updateRenovateFileFilters,
  updateLicense,
  addPostBuildScriptForLibs,
  migrateOfficialRenovate,
  disableSdkRenovate,
  migrateHusky,
  addMocksForBrickIcons,
  migrateJest,
  updateResolutions,
  updateBrickNext,
  migrateJestV2,
  updateBuildNextLibs,
  addPreBuildScriptForBricks,
  enableNextLibsRenovate,
  removeRenovateLegacyBaseBranches,
  migrateLazyBricksWithJest,
  onlyAutoMergePatchVersions,
  enableLernaWithNx,
  updateRenovateForV2,
} = require("./patches");

function initAndGetDevDependenciesVersion() {
  const rootPackageJsonPath = path.resolve("package.json");
  const rootPackageJson = readJson(rootPackageJsonPath);
  let updated = false;
  if (!rootPackageJson.easyops) {
    rootPackageJson.easyops = {};
    updated = true;
  }
  if (!rootPackageJson.easyops["dev-dependencies"]) {
    rootPackageJson.easyops["dev-dependencies"] = "0.3.2";
    updated = true;
  }
  if (updated) {
    writeJsonFile(rootPackageJsonPath, rootPackageJson);
  }
  return rootPackageJson.easyops["dev-dependencies"];
}

function updateDevDependenciesVersion() {
  const selfJson = readSelfJson();
  const rootPackageJsonPath = path.resolve("package.json");
  const rootPackageJson = readJson(rootPackageJsonPath);
  rootPackageJson.easyops["dev-dependencies"] = selfJson.version;
  writeJsonFile(rootPackageJsonPath, rootPackageJson);
}

module.exports = async function patch() {
  const currentRenewVersion = initAndGetDevDependenciesVersion();

  if (semver.lt(currentRenewVersion, "0.4.0")) {
    updateLintstagedrc();
  }

  if (semver.lt(currentRenewVersion, "0.5.0")) {
    moveBricksDeployFiles();
  }

  if (semver.lt(currentRenewVersion, "0.6.4")) {
    updateJsdom();
  }

  if (semver.lt(currentRenewVersion, "0.6.11")) {
    addMockMicroApps();
  }

  if (semver.lt(currentRenewVersion, "0.6.14")) {
    removeJestEnvJsdomSixteen();
  }

  if (semver.lt(currentRenewVersion, "0.6.41")) {
    updateWebpackMerge();
  }

  if (semver.lt(currentRenewVersion, "0.6.46")) {
    updateRenovatePostUpgradeTasks();
  }

  if (semver.lt(currentRenewVersion, "0.7.12")) {
    updatePackageJsonScriptsTestCommand();
  }

  if (semver.lt(currentRenewVersion, "0.7.25")) {
    majorBrickNext.updateVersionOfBrickNext();
  }

  if (semver.lt(currentRenewVersion, "1.0.12")) {
    updateLernaAllowBranch();
  }

  if (semver.lt(currentRenewVersion, "1.0.14")) {
    updateBuildStories();
  }

  if (semver.lt(currentRenewVersion, "1.0.21")) {
    updateMRTemplates();
  }

  if (semver.lt(currentRenewVersion, "1.1.3")) {
    updateBrickNextForNewCssVariables();
  }

  if (semver.lt(currentRenewVersion, "1.2.35")) {
    updateLicense();
  }

  if (semver.lt(currentRenewVersion, "1.3.0")) {
    addPostBuildScriptForLibs();
  }

  if (semver.lt(currentRenewVersion, "1.6.0")) {
    migrateOfficialRenovate();
  }

  if (semver.lt(currentRenewVersion, "1.7.0")) {
    disableSdkRenovate();
  }

  if (semver.lt(currentRenewVersion, "1.8.5")) {
    await migrateHusky();
  }

  if (semver.lt(currentRenewVersion, "1.8.12")) {
    addMocksForBrickIcons();
  }

  if (semver.lt(currentRenewVersion, "1.8.15")) {
    migrateJest();
  }

  if (semver.lt(currentRenewVersion, "1.13.4")) {
    // No resolution for `@testing-library/dom` is required now.
    updateResolutions({
      "@testing-library/dom": undefined,
    });
  }

  if (semver.lt(currentRenewVersion, "1.9.1")) {
    migrateJestV2();
  }

  if (semver.lt(currentRenewVersion, "1.10.1")) {
    updateRenovateFileFilters();
  }

  if (semver.lt(currentRenewVersion, "1.10.2")) {
    addLazyBricksIntoGitignore();
  }

  if (semver.lt(currentRenewVersion, "1.10.3")) {
    addPreBuildScriptForBricks();
  }

  if (semver.lt(currentRenewVersion, "1.10.6")) {
    updateBrickNext();
  }

  if (semver.lt(currentRenewVersion, "1.11.1")) {
    enableNextLibsRenovate();
  }

  if (semver.lt(currentRenewVersion, "1.11.6")) {
    removeRenovateLegacyBaseBranches();
  }

  if (semver.lt(currentRenewVersion, "1.12.0")) {
    // There is a security issue for specific versions of ua-parser-js.
    // See https://github.com/faisalman/ua-parser-js/issues/536
    updateResolutions({
      // Use the very current version of `0.7.19` to change nothing currently.
      "ua-parser-js": "0.7.19",
    });
  }

  if (semver.lt(currentRenewVersion, "1.14.0")) {
    migrateLazyBricksWithJest();
  }

  if (semver.lt(currentRenewVersion, "1.14.91")) {
    updateBuildNextLibs();
  }

  if (semver.lt(currentRenewVersion, "1.14.125")) {
    onlyAutoMergePatchVersions();
  }

  if (semver.lt(currentRenewVersion, "1.15.3")) {
    enableLernaWithNx();
  }

  if (semver.lt(currentRenewVersion, "1.17.0")) {
    updateRenovateForV2();
  }

  updateDevDependenciesVersion();
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
      if (fs.existsSync(srcDir) && fs.statSync(srcDir).isDirectory()) {
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
        let content = fs.readFileSync(direntFilePath, "utf8");
        const needReplaces = [
          [
            new RegExp(
              "(?:" +
                escapeRegExp(
                  "// Ref https://github.com/jsdom/jsdom/issues/1030"
                ) +
                "[\\r\\n]*)?" +
                escapeRegExp('import "document-register-element";') +
                "[\\r\\n]*"
            ),
            "",
          ],
          [
            new RegExp(
              escapeRegExp("const spyOnDefine = jest.fn();") +
                "[\\r\\n]*" +
                escapeRegExp("(window as any).customElements = {") +
                "[\\r\\n]*" +
                escapeRegExp("  define: spyOnDefine") +
                "[\\r\\n]*" +
                escapeRegExp("};")
            ),
            'const spyOnDefine = jest.spyOn(window.customElements, "define");',
          ],
        ];
        let updated = false;
        for (const [pattern, replacement] of needReplaces) {
          if (pattern.test(content)) {
            updated = true;
            content = content.replace(pattern, replacement);
          }
        }
        if (updated) {
          fs.writeFileSync(direntFilePath, content);
        }
      }
    });
  }
}

function addMockMicroApps() {
  const gitignoreFilePath = path.resolve(".gitignore");
  const gitignoreContent = fs.readFileSync(gitignoreFilePath, "utf8");
  const needAppendAt = new RegExp(
    `(${escapeRegExp("/dev.config.js")})([\\r\\n]*)`
  );
  const needAppend = "/mock-micro-apps";
  if (
    needAppendAt.test(gitignoreContent) &&
    !gitignoreContent.includes(needAppend)
  ) {
    fs.writeFileSync(
      gitignoreFilePath,
      gitignoreContent.replace(
        needAppendAt,
        (match, p1, p2) => `${p1}${os.EOL}${needAppend}${p2}`
      )
    );
  }
}

function removeJestEnvJsdomSixteen() {
  const filePath = path.resolve("jest.config.js");
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, "utf8");
    const needClear = new RegExp(
      " *" +
        escapeRegExp('testEnvironment: "jest-environment-jsdom-sixteen"') +
        ",?[\\r\\n]*"
    );
    if (needClear.test(content)) {
      fs.writeFileSync(filePath, content.replace(needClear, ""));
    }
  }
}

function updateWebpackMerge() {
  function updateByScope(scope) {
    const scopeDir = path.resolve(scope);
    if (!fs.existsSync(scopeDir)) {
      return;
    }

    fs.readdirSync(scopeDir, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .forEach((dirent) => {
        const webpackConfigJsPath = path.join(
          scopeDir,
          dirent.name,
          "webpack.config.js"
        );
        if (!fs.existsSync(webpackConfigJsPath)) {
          return;
        }
        let content = fs.readFileSync(webpackConfigJsPath, "utf8");
        const needReplaces = [
          [
            new RegExp(
              escapeRegExp('const merge = require("webpack-merge");') +
                "[\\r\\n]*" +
                escapeRegExp(
                  'const { bricks } = require("@next-core/webpack-config-factory");'
                )
            ),
            'const { bricks, merge } = require("@next-core/webpack-config-factory");',
          ],
        ];
        let updated = false;
        for (const [pattern, replacement] of needReplaces) {
          if (pattern.test(content)) {
            updated = true;
            content = content.replace(pattern, replacement);
          }
        }
        if (updated) {
          fs.writeFileSync(webpackConfigJsPath, content);
        }
      });
  }

  updateByScope("bricks");
  updateByScope("templates");
}

function updateRenovatePostUpgradeTasks() {
  const renovateJsonPath = path.resolve("renovate.json");
  const renovateJson = readJson(renovateJsonPath);
  const nextCoreGroup = renovateJson.packageRules.find(
    (item) => item.groupName === "next-core packages"
  );
  if (nextCoreGroup && !nextCoreGroup.postUpgradeTasks) {
    Object.assign(nextCoreGroup, {
      packagePatterns: ["^@next-core/"],
      postUpgradeTasks: {
        commands: [
          "yarn renew",
          "yarn extract",
          "./node_modules/.bin/prettier --write package.json",
        ],
        fileFilters: ["**/*"],
      },
    });
    writeJsonFile(renovateJsonPath, renovateJson);
  }
}

function updatePackageJsonScriptsTestCommand() {
  const rootPackageJsonPath = path.resolve("package.json");
  const rootPackageJson = readJson(rootPackageJsonPath);
  rootPackageJson.scripts.test =
    "cross-env NODE_ENV='test' node --expose-gc ./node_modules/.bin/jest --logHeapUsage";
  rootPackageJson.scripts["test:ci"] =
    "cross-env NODE_ENV='test' CI=true node --expose-gc ./node_modules/.bin/jest --logHeapUsage --ci";
  writeJsonFile(rootPackageJsonPath, rootPackageJson);
}

function addLazyBricksIntoGitignore() {
  const gitignoreFilePath = path.resolve(".gitignore");
  const gitignoreContent = fs.readFileSync(gitignoreFilePath, "utf8");
  const needAppendAt = new RegExp(
    `(${escapeRegExp("/bricks/*/deploy/*")})([\\r\\n]*)`
  );
  const needAppend = "/bricks/*/src/lazy-bricks";
  if (
    needAppendAt.test(gitignoreContent) &&
    !gitignoreContent.includes(needAppend)
  ) {
    fs.writeFileSync(
      gitignoreFilePath,
      gitignoreContent.replace(
        needAppendAt,
        (match, p1, p2) => `${p1}${os.EOL}${needAppend}${p2}`
      )
    );
  }
}
