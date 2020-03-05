#!/usr/bin/env node
const chalk = require("chalk");
const { syncDllAndInstall } = require(".");

// istanbul ignore next (nothing logic)
syncDllAndInstall().catch(error => {
  console.error(chalk.red(error.message));
  process.exitCode = 1;
});
