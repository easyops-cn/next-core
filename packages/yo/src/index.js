import path from "node:path";
import { fileURLToPath } from "node:url";
import minimist from "minimist";
import { Plop, run } from "plop";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
const argv = minimist(args);

Plop.prepare(
  {
    cwd: argv.cwd,
    configPath: path.join(__dirname, "plopfile.js"),
    preload: argv.preload || [],
    completion: argv.completion,
  },
  (env) =>
    Plop.execute(env, (options) =>
      run(
        {
          ...options,
          // this will make the destination path to be based on the cwd when calling the wrapper
          dest: process.cwd(),
        },
        undefined,
        true
      )
    )
);
