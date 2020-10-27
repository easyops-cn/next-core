const path = require("path");
const fs = require("fs-extra");
const yaml = require("js-yaml");

/**
 * Update `brick_next` version for brick packages which depends on
 * `@easyops/custom-antd-styles` to the latest version which contains
 * newly introduced css variables.
 */
function updateBrickNextForNewCssVariables() {
  const packageDir = path.resolve("bricks");

  if (!fs.existsSync(packageDir)) {
    return;
  }

  const brickNextVersion = require("@easyops/brick-container/package.json")
    .version;

  fs.readdirSync(packageDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .forEach((dirent) => {
      const packageJsonPath = path.join(
        packageDir,
        dirent.name,
        "package.json"
      );
      const packageJson = fs.readJsonSync(packageJsonPath);
      if (
        packageJson.devDependencies &&
        packageJson.devDependencies["@easyops/custom-antd-styles"]
      ) {
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

        const newVersion = brickNext.version.replace(
          /\^2\.\d+\.\d+/,
          `^${brickNextVersion}`
        );
        if (newVersion !== brickNext.version) {
          brickNext.version = newVersion;
          fs.outputFileSync(confYamlPath, yaml.safeDump(conf));
        } else {
          console.log(
            `Unexpected brick next version: "${brickNext.version}", in "${confYamlPath}"`
          );
        }
      }
    });
}

module.exports = updateBrickNextForNewCssVariables;
