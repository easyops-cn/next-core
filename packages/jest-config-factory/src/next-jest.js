const fs = require("fs");
const yargs = require("yargs");
const { spawn } = require("child_process");
const findFileUpward = require("./findFileUpward");

const jestCliBasePath = require
  .resolve("jest-cli/package.json", { paths: [process.cwd()] })
  .replace("/package.json", "");
const jestCliArgsPath = `${jestCliBasePath}/build/args.js`;
const { options } = require(fs.existsSync(jestCliArgsPath)
  ? jestCliArgsPath
  : `${jestCliBasePath}/build/cli/args.js`); // Todo: Change to import from package, when https://github.com/facebook/jest/pull/13970 is released.

const args = process.argv.slice(2);
const argv = yargs(args).options(options).argv;
const target = argv._[0];

function runByLerna() {
  spawn("npx", ["lerna", "run", "test", "--", ...args, "--maxWorkers=1"], {
    stdio: "inherit",
  });
}

if (!target) {
  console.log("Target not found, use lerna instead.");
  runByLerna();
} else {
  const configFile = findFileUpward(target, "jest.config.js");
  if (!configFile) {
    console.log(
      `Relevant jest config file not found for target '${target}', use lerna instead.`
    );
    runByLerna();
  } else {
    spawn("npx", ["jest", ...args, "--config", configFile], {
      stdio: "inherit",
    });
  }
}
