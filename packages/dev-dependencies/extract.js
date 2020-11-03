const path = require("path");
const semver = require("semver");
const chalk = require("chalk");
const { chain } = require("lodash");
const { writeJsonFile, readJson, readSelfJson } = require("./utils");
const patch = require("./patch");

const caretRangesRegExp = /^\^\d+\.\d+\.\d+(?:-[a-z]+\.\d+)?$/;

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
module.exports = function extract() {
  const selfJson = readSelfJson();

  const rootPackageJsonPath = path.resolve("package.json");
  const rootPackageJson = readJson(rootPackageJsonPath);
  const devDependencies = rootPackageJson.devDependencies;

  const toBeExtracted = new Map();
  const resolutions = ["@easyops/brick-types", "lodash", "@types/react"];

  if (!rootPackageJson.resolutions) {
    rootPackageJson.resolutions = {};
  } else if (rootPackageJson.resolutions.expect) {
    // Problems of `objectContaining` fixed.
    // See https://github.com/facebook/jest/pull/10508#issuecomment-720453877
    delete rootPackageJson.resolutions.expect;
  }

  // Remove all packages those are included in `@easyops/dev-dependencies`
  for (const [name, version] of Object.entries(selfJson.dependencies)) {
    if (resolutions.includes[name]) {
      rootPackageJson.resolutions[name] = version;
    }
    delete devDependencies[name];
  }

  // Remove `@size-limit/preset-app` which could cause a problem by `estimo`.
  // https://github.com/mbalabash/estimo/blob/master/scripts/findChrome.js#L1
  delete devDependencies["@size-limit/preset-app"];

  // `size-limit` to be present in root package.json.
  // https://github.com/ai/size-limit/blob/master/packages/size-limit/load-plugins.js#L20
  // `@types/*` and others require import-helper needs to be present in root package.json.
  for (const [name, version] of Object.entries(selfJson.devDependencies)) {
    toBeExtracted.set(name, version);
  }

  const dlls = ["@easyops/brick-dll", "@dll/ace", "@dll/d3", "@dll/echarts"];
  for (const pkg of dlls) {
    // 解决该包在 `npm link` 下使用时报错的问题
    const dllPackageJson = readJson(
      require.resolve(`${pkg}/package.json`, {
        paths: [process.cwd()],
      })
    );
    for (const [name, version] of Object.entries(dllPackageJson.dependencies)) {
      toBeExtracted.set(name, version);
    }
  }

  const kitPackageJson = readJson(
    require.resolve("@easyops/brick-kit/package.json", {
      paths: [process.cwd()],
    })
  );
  const kitDeps = ["@easyops/brick-types"];
  for (const name of kitDeps) {
    toBeExtracted.set(name, kitPackageJson.dependencies[name]);
  }

  for (const [name, version] of toBeExtracted.entries()) {
    if (shouldUpgrade(devDependencies[name], version)) {
      console.log(
        chalk.bold.green("Upgraded:"),
        name,
        devDependencies[name] || "",
        chalk.green("↗"),
        version
      );
      devDependencies[name] = version;
      if (resolutions.includes(name)) {
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

  writeJsonFile(rootPackageJsonPath, rootPackageJson);

  // 同时更新 Renovate 配置，DLL 的依赖由 DLL 带动更新，不需要自动更新
  const renovateJsonPath = path.resolve("renovate.json");
  const renovateJson = readJson(renovateJsonPath);
  const disabledRule = renovateJson.packageRules.find(
    (item) => item.enabled === false
  );
  const disabledPackageNames = new Set(disabledRule.packageNames);

  for (const pkg of toBeExtracted.keys()) {
    disabledPackageNames.add(pkg);
  }
  disabledRule.packageNames = Array.from(disabledPackageNames).sort();

  writeJsonFile(renovateJsonPath, renovateJson);

  patch();
};
