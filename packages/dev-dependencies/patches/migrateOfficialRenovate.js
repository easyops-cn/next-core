const path = require("path");
const { readJson, writeJsonFile } = require("../utils");

function migrateOfficialRenovate() {
  const renovateJsonPath = path.resolve("renovate.json");
  const renovateJson = readJson(renovateJsonPath);

  let migrated = false;

  // https://github.com/renovatebot/renovate/blob/1dad55586b7eee22d1545969ad363ab6bedd5ed3/lib/config/migration.ts
  const renameMap = {
    paths: "matchPaths",
    languages: "matchLanguages",
    baseBranchList: "matchBaseBranches",
    managers: "matchManagers",
    datasources: "matchDatasources",
    depTypeList: "matchDepTypes",
    packageNames: "matchPackageNames",
    packagePatterns: "matchPackagePatterns",
    sourceUrlPrefixes: "matchSourceUrlPrefixes",
    updateTypes: "matchUpdateTypes",
  };
  for (const packageRule of renovateJson.packageRules) {
    for (const [oldKey, ruleVal] of Object.entries(packageRule)) {
      const newKey = renameMap[oldKey];
      if (newKey) {
        packageRule[newKey] = ruleVal;
        delete packageRule[oldKey];
        migrated = true;
      }
    }
  }

  if (migrated) {
    writeJsonFile(renovateJsonPath, renovateJson);
  }
}

module.exports = migrateOfficialRenovate;
