const isEqual = require("lodash.isequal");
const path = require("path");
const { readJson, writeJsonFile } = require("../utils");

function removeRenovateLegacyBaseBranches() {
  const renovateJsonPath = path.resolve("renovate.json");
  const renovateJson = readJson(renovateJsonPath);

  let updated = false;
  if (Array.isArray(renovateJson.baseBranches)) {
    delete renovateJson.baseBranches;
    updated = true;
  }

  const legacyGroupIndex = renovateJson.packageRules.findIndex((item) =>
    isEqual(item.matchBaseBranches, ["legacy/brick-next_1.x"])
  );
  if (legacyGroupIndex >= 0) {
    renovateJson.packageRules.splice(legacyGroupIndex, 1);
    updated = true;
  }

  if (updated) {
    writeJsonFile(renovateJsonPath, renovateJson);
  }
}

module.exports = removeRenovateLegacyBaseBranches;
