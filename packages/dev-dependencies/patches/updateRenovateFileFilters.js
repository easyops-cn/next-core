const path = require("path");
const { readJson, writeJsonFile } = require("../utils");

function updateRenovateFileFilters() {
  const renovateJsonPath = path.resolve("renovate.json");
  const renovateJson = readJson(renovateJsonPath);

  const nextCoreGroup = renovateJson.packageRules.find(
    (item) => item.groupName === "next-core packages"
  );

  if (nextCoreGroup && nextCoreGroup.postUpgradeTasks) {
    nextCoreGroup.postUpgradeTasks.fileFilters = [
      "**/*",
      ".gitlab/**/*",
      ".huskyrc",
      ".husky/**/*",
    ];

    writeJsonFile(renovateJsonPath, renovateJson);
  }
}

module.exports = updateRenovateFileFilters;
