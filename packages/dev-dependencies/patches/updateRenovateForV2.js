const path = require("path");
const { readJson, writeJsonFile } = require("../utils");

function updateRenovateForV2() {
  const packageJson = readJson(path.resolve("package.json"));
  const renovateJsonPath = path.resolve("renovate.json");
  const renovateJson = readJson(renovateJsonPath);

  renovateJson.packageRules = [
    {
      excludePackagePatterns: ["^@next-core/", "^@next-libs/"],
      enabled: false,
    },
    {
      matchPackagePatterns: ["^@next-core/"],
      matchUpdateTypes: ["major"],
      enabled: false,
    },
    {
      groupName: "next-core packages",
      matchPackagePatterns: ["^@next-core/"],
      matchUpdateTypes: ["minor", "patch"],
      postUpgradeTasks:
        packageJson.homepage && packageJson.homepage.includes("github.com")
          ? undefined
          : {
              commands: [
                "yarn renew",
                "yarn extract",
                "./node_modules/.bin/prettier --write package.json",
                "yarn-deduplicate yarn.lock",
                "yarn",
              ],
              executionMode: "branch",
              fileFilters: [
                "**/*",
                ".gitignore",
                ".gitlab/**/*",
                ".huskyrc",
                ".husky/.gitignore",
                ".husky/**/*",
              ],
            },
    },
    {
      groupName: "next-libs packages",
      matchPackagePatterns: ["^@next-libs/"],
      separateMajorMinor: false,
    },
  ];

  writeJsonFile(renovateJsonPath, renovateJson);
}

module.exports = updateRenovateForV2;
