const path = require("path");
const fs = require("fs-extra");
const { readJson, writeJsonFile } = require("../utils");

function enableSdkRenovate() {
  // Ignore if it has sdk packages
  if (fs.existsSync(path.resolve("sdk"))) {
    return;
  }

  const renovateJsonPath = path.resolve("renovate.json");
  const renovateJson = readJson(renovateJsonPath);
  const sdkPatterns = ["^@next-sdk/", "^@sdk/"];

  const disabledGroup = renovateJson.packageRules.find(
    (item) =>
      item.enabled === false &&
      item.matchPackagePatterns &&
      sdkPatterns.some((pattern) => item.matchPackagePatterns.includes(pattern))
  );

  if (disabledGroup) {
    disabledGroup.matchPackagePatterns = disabledGroup.matchPackagePatterns.filter(
      (item) => !sdkPatterns.includes(item)
    );

    writeJsonFile(renovateJsonPath, renovateJson);
  }
}

module.exports = enableSdkRenovate;
