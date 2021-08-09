const path = require("path");
const fs = require("fs-extra");
const yaml = require("js-yaml");
const semver = require("semver");

/**
 * Update `brick_next` version for brick packages because `@babel/runtime` is newly
 * introduced in brick-dll since brick_next@2.29.0
 */
function updateBrickNext() {
  const packageDir = path.resolve("bricks");

  if (!fs.existsSync(packageDir)) {
    return;
  }

  const brickNextVersion = "2.29.11";

  fs.readdirSync(packageDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .forEach((dirent) => {
      const confYamlPath = path.join(
        packageDir,
        dirent.name,
        "deploy-default/package.conf.yaml"
      );
      const confYaml = fs.readFileSync(confYamlPath);
      const conf = yaml.safeLoad(confYaml);
      const brickNext = conf.dependencies.find(
        (dep) => dep.name === "brick_next"
      );
      if (
        /\^\d+\.\d+\.\d+$/.test(brickNext.version) &&
        semver.lt(brickNext.version.substr(1), brickNextVersion)
      ) {
        brickNext.version = `^${brickNextVersion}`;
        fs.outputFileSync(confYamlPath, yaml.safeDump(conf));
      }
    });
}

module.exports = updateBrickNext;
