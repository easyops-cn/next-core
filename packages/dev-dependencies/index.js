// File System, hard to test for now.
/* istanbul ignore file */
const path = require("path");
const chalk = require("chalk");
const execa = require("execa");
const { argv } = require("yargs");
const semver = require("semver");
const extract = require("./extract");
const { readJson } = require("./utils");

exports.renew = async function renew() {
  await updateSelf();
  await yarnExtract();
};

exports.extractAndInstall = async function extractAndInstall() {
  await extractOnly();
  await yarnInstall();
};

function updateSelf() {
  const selfPackageName = "@next-core/dev-dependencies";
  let tag = "";
  if (argv.tag) {
    tag = `@${argv.tag}`;
  } else {
    // Upgrade to the max satisfying version.
    const rootPackageJson = readJson(path.resolve("package.json"));
    const currentRange = rootPackageJson.devDependencies[selfPackageName];
    if (currentRange) {
      // https://classic.yarnpkg.com/en/docs/cli/info
      const result = execa.sync("yarn", [
        "info",
        selfPackageName,
        "versions",
        "--json",
      ]);
      const content = result.stdout;
      if (content) {
        const versions = JSON.parse(content).data;
        tag = `@^${semver.maxSatisfying(
          versions,
          currentRange.startsWith("^0.") ? "< 1" : currentRange
        )}`;
      } else {
        console.error("yarn info failed:", result.stderr);
        tag = currentRange.startsWith("^0.") ? "@0.x" : "@latest";
      }
    }
  }
  console.log(
    chalk.inverse(
      `[dev-dependencies-renew] $ yarn add -D -W ${selfPackageName}${tag}`
    )
  );
  return execa("yarn", ["add", "-D", "-W", `${selfPackageName}${tag}`], {
    stdio: "inherit",
    env: {
      // https://github.com/mbalabash/estimo/blob/master/scripts/findChrome.js#L1
      ESTIMO_DISABLE: "true",
    },
  });
}

function extractOnly() {
  console.log(chalk.inverse("[dev-dependencies-renew] extract dependencies"));
  return extract();
}

function yarnInstall() {
  console.log(chalk.inverse("[dev-dependencies-renew] $ yarn"));
  return execa("yarn", [], {
    stdio: "inherit",
    env: {
      // https://github.com/mbalabash/estimo/blob/master/scripts/findChrome.js#L1
      ESTIMO_DISABLE: "true",
    },
  });
}

function yarnExtract() {
  console.log(chalk.inverse("[dev-dependencies-renew] $ yarn extract"));
  return execa("yarn", ["extract"], {
    stdio: "inherit",
    env: {
      // https://github.com/mbalabash/estimo/blob/master/scripts/findChrome.js#L1
      ESTIMO_DISABLE: "true",
    },
  });
}
