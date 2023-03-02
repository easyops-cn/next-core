const yargs = require("yargs");
const { spawn } = require("child_process");
const { options } = require(require
  .resolve("jest-cli/package.json", { paths: [process.cwd()] })
  .replace("package.json", "build/cli/args.js")); // Todo: Change to import from package, when https://github.com/facebook/jest/pull/13970 is released.
const findFileUpward = require("./findFileUpward");

const args = process.argv.slice(2);
const argv = yargs(args).options(options).argv;
const target = argv._[0];

function runByLerna() {
  spawn("npx", ["lerna", "run", "test", "--", ...args], {
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
