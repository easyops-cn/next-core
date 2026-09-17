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
        (() => {
          if (!packageJson.homepage) return false;
          try {
            const { hostname } = new URL(packageJson.homepage);
            return (
              hostname === "github.com" || hostname.endsWith(".github.com")
            );
          } catch (e) {
            return false;
          }
        })()
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
