// File System, hard to test for now.
/* istanbul ignore file */
const chalk = require("chalk");
const execa = require("execa");
const extract = require("./extract");

exports.renew = async function renew() {
  await updateSelf();
  await yarnExtract();
};

exports.extractAndInstall = async function extractAndInstall() {
  await extractOnly();
  await yarnInstall();
};

function updateSelf() {
  console.log(
    chalk.inverse(
      "[dev-dependencies-renew] $ yarn add -D -W @easyops/dev-dependencies"
    )
  );
  return execa("yarn", ["add", "-D", "-W", "@easyops/dev-dependencies"], {
    stdio: "inherit",
    env: {
      // https://github.com/mbalabash/estimo/blob/master/scripts/findChrome.js#L1
      ESTIMO_DISABLE: "true"
    }
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
      ESTIMO_DISABLE: "true"
    }
  });
}

function yarnExtract() {
  console.log(chalk.inverse("[dev-dependencies-renew] $ yarn extract"));
  return execa("yarn", ["extract"], {
    stdio: "inherit",
    env: {
      // https://github.com/mbalabash/estimo/blob/master/scripts/findChrome.js#L1
      ESTIMO_DISABLE: "true"
    }
  });
}
