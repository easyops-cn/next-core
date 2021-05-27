const path = require("path");
const fs = require("fs-extra");
const { writeJsonFile, readJson } = require("../utils");

function updateLicense() {
  const rootPackageJsonPath = path.resolve("package.json");
  const rootPackageJson = readJson(rootPackageJsonPath);
  const license = rootPackageJson.license;
  if (license === "UNLICENSED") {
    return;
  }

  const dirs = ["bricks", "libs", "micro-apps", "templates"];
  for (const dir of dirs) {
    _updateLicense(path.resolve(dir), license);
  }
}

function _updateLicense(packageDir, license) {
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
      replaceLicense(packageJsonPath, packageJson, license);
    });
}

function replaceLicense(jsonPath, json, license) {
  writeJsonFile(jsonPath, {
    ...json,
    license,
  });
}

module.exports = updateLicense;
