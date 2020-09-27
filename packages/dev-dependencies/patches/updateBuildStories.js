const path = require("path");
const fs = require("fs-extra");
const { writeJsonFile, readJson } = require("../utils");

function updateBuildStories() {
  const packageDir = path.resolve("bricks");

  if (!fs.existsSync(packageDir)) {
    return;
  }

  fs.readdirSync(packageDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .forEach((dirent) => {
      const packageJsonPath = path.join(
        packageDir,
        dirent.name,
        "package.json"
      );
      const packageJson = readJson(packageJsonPath);
      if (packageJson.scripts && packageJson.scripts["build:stories"]) {
        packageJson.scripts["build:stories"] =
          'if [ -d stories ];then  tsc stories/index.ts --module commonjs --esModuleInterop --allowSyntheticDefaultImports --skipLibCheck --outDir dist/stories; else echo " no stories "; fi';
        writeJsonFile(packageJsonPath, packageJson);
      }
    });
}

module.exports = updateBuildStories;
