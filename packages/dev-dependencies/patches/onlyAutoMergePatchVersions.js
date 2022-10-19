const path = require("path");
const { readJson, writeJsonFile } = require("../utils");

function onlyAutoMergePatchVersions() {
  const renovateJsonPath = path.resolve("renovate.json");
  const renovateJson = readJson(renovateJsonPath);

  const devAutoMergeGroup = renovateJson.packageRules.find(
    (item) =>
      item.automerge === true &&
      Array.isArray(item.matchDepTypes) &&
      item.matchDepTypes.join(",") === "devDependencies" &&
      Array.isArray(item.matchUpdateTypes) &&
      item.matchUpdateTypes.join(",") !== "patch"
  );

  if (devAutoMergeGroup) {
    devAutoMergeGroup.matchUpdateTypes = ["patch"];
    writeJsonFile(renovateJsonPath, renovateJson);
  }
}

module.exports = onlyAutoMergePatchVersions;
