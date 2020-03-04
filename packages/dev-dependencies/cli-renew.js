#!/usr/bin/env node
const chalk = require("chalk");
const { renew } = require(".");

// istanbul ignore next (nothing logic)
renew().catch(error => {
  console.error(chalk.red(error.message));
  process.exitCode = 1;
});
