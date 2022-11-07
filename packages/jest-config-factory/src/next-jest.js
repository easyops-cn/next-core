const { spawn } = require("child_process");
const findFileUpward = require("./findFileUpward");

const args = process.argv.slice(2);
const target = args.find((a) => !a.startsWith("-"));

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
