const path = require("path");
const fs = require("fs");
const semver = require("semver");
const { chain, pull } = require("lodash");
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
