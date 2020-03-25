#!/usr/bin/env node
const chalk = require("chalk");
const { extractAndInstall } = require(".");

// istanbul ignore next (nothing logic)
extractAndInstall().catch(error => {
  console.error(chalk.red(error.message));
  process.exitCode = 1;
});
