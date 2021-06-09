const path = require("path");
const fs = require("fs-extra");

function updateResolutions() {
  const rootPackageJsonPath = path.resolve("package.json");
  const rootPackageJson = fs.readJsonSync(rootPackageJsonPath);

  if (!rootPackageJson.resolutions) {
    rootPackageJson.resolutions = {};
  }

  // Add a resolution to fix an issue of `clearImmediate is not defined`.
  // See https://github.com/testing-library/dom-testing-library/issues/899
  const pkgName = "@testing-library/dom";
  const pkgVersion = "^7.31.2";
  if (!rootPackageJson.resolutions[pkgName]) {
    rootPackageJson.resolutions[pkgName] = pkgVersion;
    fs.writeJsonSync(rootPackageJsonPath, rootPackageJson);
  }
}

module.exports = updateResolutions;
