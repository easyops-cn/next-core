// File System, hard to test for now.
/* istanbul ignore file */
const path = require("path");
const chalk = require("chalk");
const execa = require("execa");
const { argv } = require("yargs");
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
  let tag = "";
  if (argv.tag) {
    tag = `@${argv.tag}`;
  } else {
    // Make the tag to be `next` if it's already in `next`.
    const rootPackageJson = readJson(path.resolve("package.json"));
    if (
      rootPackageJson.easyops &&
      rootPackageJson.easyops["dev-dependencies"] &&
      rootPackageJson.easyops["dev-dependencies"].includes("next")
    ) {
      tag = "@next";
    }
  }
  console.log(
    chalk.inverse(
      `[dev-dependencies-renew] $ yarn add -D -W @easyops/dev-dependencies${tag}`
    )
  );
  return execa("yarn", ["add", "-D", "-W", `@easyops/dev-dependencies${tag}`], {
    stdio: "inherit",
    env: {
      // https://github.com/mbalabash/estimo/blob/master/scripts/findChrome.js#L1
      ESTIMO_DISABLE: "true",
    },
  });
}

function extractOnly() {
  console.log(chalk.inverse("[dev-dependencies-renew] extract dependencies"));
  extract();
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
