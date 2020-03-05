const path = require("path");
const fs = require("fs");
const prettier = require("prettier");
const semver = require("semver");
const chalk = require("chalk");
const { chain } = require("lodash");

const caretRangesRegExp = /^\^\d+\.\d+\.\d+$/;

function shouldUpgrade(fromVersion, toVersion) {
  return (
    !fromVersion ||
    (caretRangesRegExp.test(fromVersion) &&
      caretRangesRegExp.test(toVersion) &&
      semver.lt(fromVersion.substr(1), toVersion.substr(1)))
  );
}

// 将 DLL 的依赖包及其版本都放到仓库根目录的 `package.json` 的 `devDependencies` 中，
// 以支持 IDE 的 auto-import
module.exports = function syncDll() {
  const rootPackageJsonPath = path.resolve("package.json");
  const rootPackageJson = require(rootPackageJsonPath);
  const devDependencies = rootPackageJson.devDependencies;

  const dlls = ["@easyops/brick-dll", "@dll/ace", "@dll/d3", "@dll/echarts"];
  for (const pkg of dlls) {
    // 解决该包在 `npm link` 下使用时报错的问题
    const dllPackageJson = require(require.resolve(`${pkg}/package.json`, {
      paths: [process.cwd()]
    }));
    for (const [name, version] of Object.entries(dllPackageJson.dependencies)) {
      if (shouldUpgrade(devDependencies[name], version)) {
        console.log(
          chalk.bold.green("Upgraded:"),
          name,
          devDependencies[name] || "",
          chalk.green("↗"),
          version
        );
        devDependencies[name] = version;
      } else {
        console.log(
          chalk.bold.yellow("Ignored:"),
          name,
          devDependencies[name],
          semver.compare(devDependencies[name].substr(1), version.substr(1))
            ? chalk.yellow(">")
            : "=",
          version
        );
      }
    }
  }

  const kitPackageJson = require(require.resolve(
    "@easyops/brick-kit/package.json",
    {
      paths: [process.cwd()]
    }
  ));
  const kitDeps = ["@easyops/brick-types"];
  for (const name of kitDeps) {
    const version = kitPackageJson.dependencies[name];
    if (shouldUpgrade(devDependencies[name], version)) {
      console.log(
        chalk.bold.green("Upgraded:"),
        name,
        devDependencies[name] || "",
        chalk.green("↗"),
        version
      );
      devDependencies[name] = version;
      if (rootPackageJson.resolutions) {
        rootPackageJson.resolutions[name] = version;
      }
    } else {
      console.log(
        chalk.bold.yellow("Ignored:"),
        name,
        devDependencies[name],
        semver.compare(devDependencies[name].substr(1), version.substr(1))
          ? chalk.yellow(">")
          : "=",
        version
      );
    }
  }

  // 根据包名排序
  rootPackageJson.devDependencies = chain(devDependencies)
    .toPairs()
    .sortBy(0)
    .fromPairs()
    .value();

  fs.writeFileSync(
    rootPackageJsonPath,
    prettier.format(JSON.stringify(rootPackageJson), { parser: "json" })
  );

  // 同时更新 Renovate 配置，DLL 的依赖由 DLL 带动更新，不需要自动更新
  const renovateJsonPath = path.resolve("renovate.json");
  const renovateJson = require(renovateJsonPath);
  const disabledRule = renovateJson.packageRules.find(
    item => item.enabled === false
  );
  const disabledPackageNames = new Set(disabledRule.packageNames);

  for (const pkg of dlls) {
    // 解决该包在 `npm link` 下使用时报错的问题
    const dllPackageJson = require(require.resolve(`${pkg}/package.json`, {
      paths: [process.cwd()]
    }));
    for (const name of Object.keys(dllPackageJson.dependencies)) {
      disabledPackageNames.add(name);
    }
  }
  disabledRule.packageNames = Array.from(disabledPackageNames).sort();

  fs.writeFileSync(
    renovateJsonPath,
    prettier.format(JSON.stringify(renovateJson), { parser: "json" })
  );
};
