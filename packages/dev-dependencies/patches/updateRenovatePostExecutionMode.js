const path = require("path");
const { readJson, writeJsonFile } = require("../utils");

function updateRenovatePostExecutionMode() {
  const renovateJsonPath = path.resolve("renovate.json");
  const renovateJson = readJson(renovateJsonPath);

  if (
    renovateJson.postUpgradeTasks &&
    renovateJson.postUpgradeTasks.executionMode !== "branch"
  ) {
    renovateJson.postUpgradeTasks.executionMode = "branch";
    writeJsonFile(renovateJsonPath, renovateJson);
  }
}

module.exports = updateRenovatePostExecutionMode;
