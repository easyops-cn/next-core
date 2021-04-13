const path = require("path");
const fs = require("fs-extra");
const { writeJsonFile, readJson } = require("../utils");

function addPostBuildScriptForLibs() {
  const packageDir = path.resolve("libs");

  if (!fs.existsSync(packageDir)) {
    return;
  }

  fs.readdirSync(packageDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .forEach((dirent) => {
      const libDir = path.join(packageDir, dirent.name);
      const packageJsonPath = path.join(libDir, "package.json");
      const packageJson = readJson(packageJsonPath);
      if (packageJson.scripts && packageJson.scripts["build"]) {
        // First, add `postbuild` in scripts in package.json.
        const entries = Object.entries(packageJson.scripts);
        const index =
          entries.length -
          entries
            .slice()
            .reverse()
            .findIndex((entry) => entry[0].startsWith("build"));
        entries.splice(index, 0, ["postbuild", "node scripts/post-build.js"]);
        packageJson.scripts = Object.fromEntries(entries);
        writeJsonFile(packageJsonPath, packageJson);

        // Then, create new file of post-build.js.
        const scriptFilePath = "scripts/post-build.js";
        fs.outputFileSync(
          path.join(libDir, scriptFilePath),
          fs.readFileSync(
            path.join(__dirname, "../template/libs", scriptFilePath),
            "utf8"
          )
        );
      }
    });
}

module.exports = addPostBuildScriptForLibs;
