const path = require("path");
const fs = require("fs");
const {
  scanBricksInStoryboard,
  scanTemplatesInStoryboard
} = require("@easyops/brick-utils");
const yaml = require("js-yaml");

module.exports = function ensureDeps() {
  const packageJson = require(path.resolve("package.json"));
  const storyboardJson = require(path.resolve("storyboard.json"));

  const requiredBricks = scanBricksInStoryboard(storyboardJson);
  const requiredTemplates = scanTemplatesInStoryboard(storyboardJson);
  const peerDependencies = Object.keys(packageJson.peerDependencies || []);
  const importedPackages = storyboardJson.imports || [];

  // 校验 imports 字段中 package 是否在 peerDependencies 声明
  importedPackages.forEach(pkg => {
    if (!peerDependencies.includes(pkg)) {
      throw new Error(
        `Can't find ${pkg} module, please add it to peerDependencies of "${packageJson.name}"`
      );
    }
  });

  // 收集 import 字段中 package 下所有的 bricks 和 templates
  const importedAllBricks = new Set();
  const importedAllTemplates = new Set();
  importedPackages.forEach(pkg => {
    const isTemplates = pkg.startsWith("@templates/");
    const isBricks = pkg.startsWith("@bricks/");
    if (isTemplates) {
      // 解决该包在 `npm link` 下使用时报错的问题
      const templatesJson = require(require.resolve(
        `${pkg}/dist/templates.json`,
        {
          paths: [process.cwd()]
        }
      ));
      templatesJson.templates.forEach(template => {
        importedAllTemplates.add(template);
      });
    } else if (isBricks) {
      // 解决该包在 `npm link` 下使用时报错的问题
      const bricksJson = require(require.resolve(`${pkg}/dist/bricks.json`, {
        paths: [process.cwd()]
      }));
      bricksJson.bricks.forEach(brick => {
        importedAllBricks.add(brick);
      });
    } else {
      throw new Error(`unexpected import: ${pkg}`);
    }
  });

  // 校验 micro-app 所使用的 bricks 是否都在 imported package 的元素中
  requiredBricks.forEach(brick => {
    if (!importedAllBricks.has(brick)) {
      throw new Error(
        `The custom element "${brick}" is used, but none of dependent packages defined it in "${packageJson.name}"`
      );
    }
  });

  // 校验 micro-app 所使用的 templates 是否都在 imported package 的模板中
  requiredTemplates.forEach(template => {
    if (!importedAllTemplates.has(template)) {
      throw new Error(
        `The template "${template}" is used, but none of dependent packages defined it in "${packageJson.name}"`
      );
    }
  });

  // 校验 `package.conf.yaml` 中是否包含了 `*-NB` `*-NT` 的构件，它们应当声明在 `package.json` 的 `peerDependencies` 中。
  const confPath = path.resolve("deploy-default/package.conf.yaml");
  if (!fs.existsSync(confPath)) {
    return;
  }

  const conf = yaml.safeLoad(fs.readFileSync(confPath, "utf8"));
  const unexpectedDependencies = conf.dependencies
    .map(dep => dep.name)
    .filter(name => name.endsWith("-NB") || name.endsWith("-NT"));
  if (unexpectedDependencies.length > 0) {
    throw new Error(
      `Unexpected dependencies in "package.conf.yaml": ${unexpectedDependencies.join(
        ","
      )}. *-NB and *-NT dependencies should always be declared in "package.json"'s "peerDependencies".`
    );
  }
};
