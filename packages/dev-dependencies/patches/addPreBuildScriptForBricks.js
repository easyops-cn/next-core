const path = require("path");
const fs = require("fs-extra");
const { writeJsonFile, readJson } = require("../utils");

// Add pre-build script for bricks, which will generate code for lazy bricks.
function addPreBuildScriptForBricks() {
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
      if (packageJson.name.includes("/providers-of-")) {
        return;
      }
      const scripts = {};
      for (const [key, value] of Object.entries(packageJson.scripts)) {
        if (key === "start") {
          scripts.prestart = "node scripts/pre-build.js";
        } else if (key === "build") {
          scripts.prebuild = "node scripts/pre-build.js";
        }
        scripts[key] = value;
      }
      packageJson.scripts = scripts;
      writeJsonFile(packageJsonPath, packageJson);

      const preBuildJsFilePath = path.join(
        packageDir,
        dirent.name,
        "scripts/pre-build.js"
      );
      fs.outputFileSync(
        preBuildJsFilePath,
        `const { preBuild } = require("@next-core/build-config-factory");

preBuild("bricks");
`
      );
    });
}

module.exports = addPreBuildScriptForBricks;
