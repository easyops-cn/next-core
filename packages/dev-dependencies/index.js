// File System, hard to test for now.
/* istanbul ignore file */
const chalk = require("chalk");
const execa = require("execa");
const syncDll = require("./sync-dll");

exports.renew = async function renew() {
  await updateSelf();
  await syncDllOnly();
  await yarnInstall();
};

exports.syncDllAndInstall = async function syncDllAndInstall() {
  await syncDllOnly();
  await yarnInstall();
};

function updateSelf() {
  console.log(
    chalk.inverse(
      "[dev-dependencies-renew] $ yarn add -D -W @easyops/dev-dependencies"
    )
  );
  return execa("yarn", [], {
    stdio: "inherit",
    env: {
      // https://github.com/mbalabash/estimo/blob/master/scripts/findChrome.js#L1
      ESTIMO_DISABLE: "true"
    }
  });
}

function syncDllOnly() {
  console.log(chalk.inverse("[dev-dependencies-renew] sync dll dependencies"));
  syncDll();
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
