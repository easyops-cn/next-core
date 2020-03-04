#!/usr/bin/env node
const chalk = require("chalk");
const { syncDll } = require(".");

// istanbul ignore next (nothing logic)
syncDll().catch(error => {
  console.error(chalk.red(error.message));
  process.exitCode = 1;
});
