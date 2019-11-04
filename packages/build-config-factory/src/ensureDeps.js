const path = require("path");
const {
  scanBricksInStoryboard,
  scanTemplatesInStoryboard
} = require("@easyops/brick-utils");

module.exports = function ensureDeps() {
  const microPackage = require(path.join(process.cwd(), "package.json"));

  const microStoryboard = require(path.join(process.cwd(), "storyboard.json"));

  // 排除掉原生的 html 标签，custom-element 都会带 -
  const requiredBricks = scanBricksInStoryboard(microStoryboard).filter(item =>
    item.includes("-")
  );

  const requiredTemplates = scanTemplatesInStoryboard(microStoryboard);

  const peerDependencies = Object.keys(microPackage.peerDependencies || []);

  const importedPackages = microStoryboard.imports || [];

  // 校验 imports 字段中 package 是否在 peerDependencies 声明
  importedPackages.forEach(pkg => {
    if (!peerDependencies.includes(pkg)) {
      throw new Error(
        `Can't find ${pkg} module, please add it to peerDependencies of "${microPackage.name}"`
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
        `The custom element "${brick}" is used, but none of dependent packages defined it in "${microPackage.name}"`
      );
    }
  });

  // 校验 micro-app 所使用的 templates 是否都在 imported package 的模板中
  requiredTemplates.forEach(template => {
    if (!importedAllTemplates.has(template)) {
      throw new Error(
        `The template "${template}" is used, but none of dependent packages defined it in "${microPackage.name}"`
      );
    }
  });
};
