const path = require("path");
const fs = require("fs-extra");

function updateResolutions(pkg) {
  const rootPackageJsonPath = path.resolve("package.json");
  const rootPackageJson = fs.readJsonSync(rootPackageJsonPath);

  if (!rootPackageJson.resolutions) {
    rootPackageJson.resolutions = {};
  }

  let updated = false;
  for (const [pkgName, pkgVersion] of Object.entries(pkg)) {
    // Add or remove resolutions.
    if (
      (Number(!rootPackageJson.resolutions[pkgName]) ^ Number(!pkgVersion)) ===
      1
    ) {
      rootPackageJson.resolutions[pkgName] = pkgVersion;
      updated = true;
      fs.writeJsonSync(rootPackageJsonPath, rootPackageJson);
    }
  }

  if (updated) {
    fs.writeJsonSync(rootPackageJsonPath, rootPackageJson);
  }
}

module.exports = updateResolutions;
