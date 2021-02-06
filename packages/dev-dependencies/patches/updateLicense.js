const path = require("path");
const fs = require("fs-extra");
const { writeJsonFile, readJson } = require("../utils");

function updateLicense(rootPackageJsonPath, rootPackageJson) {
  const license = rootPackageJson.license;
  if (!license || license !== "UNLICENSED") {
    return;
  }

  replaceLicense(rootPackageJsonPath, rootPackageJson);

  const dirs = ["bricks", "libs", "micro-apps", "templates"];
  for (const dir of dirs) {
    _updateLicense(path.resolve(dir));
  }
}

function _updateLicense(packageDir) {
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
      replaceLicense(packageJsonPath, packageJson);
    });
}

function replaceLicense(jsonPath, json) {
  writeJsonFile(
    jsonPath,
    {
      ...json,
      license: "GPL-3.0"
    }
  )
}

module.exports = updateLicense;
