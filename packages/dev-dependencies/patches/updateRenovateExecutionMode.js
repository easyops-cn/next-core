const path = require("path");
const { readJson, writeJsonFile } = require("../utils");

function updateRenovateExecutionMode() {
  const renovateJsonPath = path.resolve("renovate.json");
  const renovateJson = readJson(renovateJsonPath);

  const nextCoreGroup = renovateJson.packageRules.find(
    (item) => item.groupName === "next-core packages"
  );

  if (
    nextCoreGroup &&
    nextCoreGroup.postUpgradeTasks &&
    nextCoreGroup.postUpgradeTasks.executionMode !== "branch"
  ) {
    nextCoreGroup.postUpgradeTasks.executionMode = "branch";

    writeJsonFile(renovateJsonPath, renovateJson);
  }
}

module.exports = updateRenovateExecutionMode;
