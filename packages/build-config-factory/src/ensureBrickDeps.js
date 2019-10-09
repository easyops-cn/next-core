const path = require("path");
const { scanBricksInStoryboard } = require("@easyops/brick-utils");

module.exports = function ensureBrickDeps() {
  const microPackage = require(path.join(process.cwd(), "package.json"));

  const microStoryboard = require(path.join(process.cwd(), "storyboard.json"));

  // 排除掉原生的 html 标签，custom-element 都会带 -
  const requiredBricks = scanBricksInStoryboard(microStoryboard).filter(item =>
    item.includes("-")
  );

  const dependencies = Object.keys(microPackage.dependencies || []);

  const importedPackages = microStoryboard.imports || [];

  // 校验 imports 字段中 package 是否在 dependencies 声明
  importedPackages.forEach(pkg => {
    if (!dependencies.includes(pkg)) {
      throw new Error(
        `Can't find ${pkg} module, please add it to dependencies of "${microPackage.name}"`
      );
    }
  });

  // 收集 import 字段中 package 下所有的 brick 元素
  const importedAllBricks = new Set();
  importedPackages.forEach(pkg => {
    // 解决该包在 `npm link` 下使用时报错的问题
    const brickJson = require(require.resolve(`${pkg}/dist/bricks.json`, {
      paths: [process.cwd()]
    }));
    brickJson.bricks.forEach(brick => {
      importedAllBricks.add(brick);
    });
  });

  // 校验 micro-app 所使用的 brick 是否都在 imported package 的元素中
  requiredBricks.forEach(brick => {
    if (!importedAllBricks.has(brick)) {
      throw new Error(
        `The custom element "${brick}" is used, but none of dependent packages defined it in "${microPackage.name}"`
      );
    }
  });
};
