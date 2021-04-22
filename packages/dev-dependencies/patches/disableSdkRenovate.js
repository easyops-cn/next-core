const path = require("path");
const { readJson, writeJsonFile } = require("../utils");

function disableSdkRenovate() {
  const renovateJsonPath = path.resolve("renovate.json");
  const renovateJson = readJson(renovateJsonPath);

  let updated = false;

  const automergeGroup = renovateJson.packageRules.find(
    (item) =>
      item.automerge &&
      Array.isArray(item.matchDepTypes) &&
      item.matchDepTypes.join(",") === "devDependencies" &&
      !item.matchUpdateTypes
  );

  if (automergeGroup) {
    // Disallow major updates to be automerged.
    automergeGroup.matchUpdateTypes = ["minor", "patch"];
    updated = true;
  }

  const disabledGroup = renovateJson.packageRules.find(
    (item) => item.enabled === false
  );

  if (disabledGroup && disabledGroup.matchPackagePatterns) {
    const newPackagesToBeDisabled = [
      "^@bricks/",
      "^@libs/",
      "^@micro-apps/",
      "^@sdk/",
      "^@templates/",
      "^@next-bricks/",
      "^@next-libs/",
      "^@next-micro-apps/",
      "^@next-sdk/",
      "^@next-legacy-templates/",
    ].filter((pkg) => !disabledGroup.matchPackagePatterns.includes(pkg));
    if (newPackagesToBeDisabled.length > 0) {
      disabledGroup.matchPackagePatterns.push(...newPackagesToBeDisabled);
      updated = true;
    }
  }

  const sdkGroupIndex = renovateJson.packageRules.findIndex(
    (item) => item.groupName === "sdk packages"
  );

  if (sdkGroupIndex !== -1) {
    // No sdk packages renovate any more.
    renovateJson.packageRules.splice(sdkGroupIndex, 1);
    updated = true;
  }

  if (updated) {
    writeJsonFile(renovateJsonPath, renovateJson);
  }
}

module.exports = disableSdkRenovate;
