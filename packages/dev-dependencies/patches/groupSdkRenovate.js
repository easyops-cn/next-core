const path = require("path");
const fs = require("fs-extra");
const { readJson, writeJsonFile } = require("../utils");

function groupSdkRenovate() {
  // Ignore if it has sdk packages
  if (fs.existsSync(path.resolve("sdk"))) {
    return;
  }

  const renovateJsonPath = path.resolve("renovate.json");
  const renovateJson = readJson(renovateJsonPath);

  const sdkGroup = renovateJson.packageRules.find(
    (item) => item.groupName === "sdk packages"
  );

  if (!sdkGroup) {
    renovateJson.packageRules.push({
      groupName: "sdk packages",
      matchPackagePatterns: ["^@next-sdk/", "^@sdk/"],
      automerge: false,
    });

    writeJsonFile(renovateJsonPath, renovateJson);
  }
}

module.exports = groupSdkRenovate;
