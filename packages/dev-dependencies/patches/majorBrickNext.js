const path = require("path");
const fs = require("fs-extra");
const yaml = require("js-yaml");

function updateVersionOfBrickNext() {
  const dirs = ["micro-apps", "templates"];
  for (const dir of dirs) {
    _updateVersionOfBrickNext(path.resolve(dir));
  }
}

function _updateVersionOfBrickNext(packageDir) {
  if (!fs.existsSync(packageDir)) {
    return;
  }

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
      if (/^\^1\.\d+\.\d+$/.test(brickNext.version)) {
        brickNext.version += " || ^2.0.0";
        fs.outputFileSync(confYamlPath, yaml.safeDump(conf));
      } else if (!/\^2\./.test(brickNext.version)) {
        throw new Error(`Unexpected brick next version: ${brickNext.version}`);
      }
    });
}

exports.updateVersionOfBrickNext = updateVersionOfBrickNext;
