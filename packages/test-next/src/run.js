import path from "node:path";
import { existsSync } from "node:fs";
import jest from "jest";
import { createJestConfig } from "./createJestConfig.js";

const packageDir = process.cwd();
const configJs = path.join(packageDir, "test.config.js");
let config = {};
if (existsSync(configJs)) {
  config = (await import(configJs)).default;
}

const args = process.argv.slice(2);

args.push(
  "--config",
  JSON.stringify(
    createJestConfig({
      cwd: packageDir,
      ...config,
    })
  )
);

jest.run(args);
