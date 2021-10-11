const path = require("path");
const { readJson, writeJsonFile } = require("../utils");

function enableNextLibsRenovate() {
  const renovateJsonPath = path.resolve("renovate.json");
  const renovateJson = readJson(renovateJsonPath);

  const nextLibsPattern = "^@next-libs/";
  const disabledGroup = renovateJson.packageRules.find(
    (item) =>
      item.enabled === false &&
      item.matchPackagePatterns &&
      item.matchPackagePatterns.includes(nextLibsPattern)
  );

  let updated = false;
  if (disabledGroup) {
    disabledGroup.matchPackagePatterns =
      disabledGroup.matchPackagePatterns.filter(
        (item) => item !== nextLibsPattern
      );
    updated = true;
  }

  const nextLibsGroupName = "next-libs packages";
  const nextLibsGroup = renovateJson.packageRules.find(
    (item) => item.groupName === nextLibsGroupName
  );
  if (!nextLibsGroup) {
    renovateJson.packageRules.push({
      groupName: nextLibsGroupName,
      matchPackagePatterns: [nextLibsPattern],
    });
    updated = true;
  }

  if (updated) {
    writeJsonFile(renovateJsonPath, renovateJson);
  }
}

module.exports = enableNextLibsRenovate;
