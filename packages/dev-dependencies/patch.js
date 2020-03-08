const path = require("path");
const fs = require("fs");
const semver = require("semver");
const prettier = require("prettier");
const { chain, pull } = require("lodash");

module.exports = function patch() {
  const rootPackageJsonPath = path.resolve("package.json");
  const rootPackageJson = require(rootPackageJsonPath);
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

  rootPackageJson.easyops[
    "dev-dependencies"
  ] = require("./package.json").version;

  writeJsonFile(rootPackageJsonPath, rootPackageJson);
};

function updateLintstagedrc() {
  const filePath = path.resolve(".lintstagedrc");
  if (fs.existsSync(filePath)) {
    const lintstagedrc = JSON.parse(fs.readFileSync(filePath, "utf-8"));
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

function writeJsonFile(filePath, content) {
  fs.writeFileSync(
    filePath,
    prettier.format(JSON.stringify(content), { parser: "json" })
  );
}
