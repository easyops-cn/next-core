// @ts-check
import { spawn } from "node:child_process";
import path from "node:path";
import findFileUpward from "./findFileUpward.js";

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
  const packageJsonFile = findFileUpward(target, "package.json");
  const packageDir = path.dirname(packageJsonFile);
  spawn("npx", ["test-next", ...args], {
    cwd: packageDir,
    stdio: "inherit",
    env: {
      NODE_ENV: "test",
      ...process.env,
    },
  });
}
