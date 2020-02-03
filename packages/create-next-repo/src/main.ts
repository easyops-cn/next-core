// File System, hard to test for now.
/* istanbul ignore file */
import path from "path";
import chalk from "chalk";
import meow from "meow";
import { update } from "./update";
import { create } from "./create";

const { input, flags } = meow({
  flags: {
    internal: {
      type: "boolean"
    },
    update: {
      type: "boolean"
    }
  }
});

export async function main(): Promise<void> {
  if (input.length !== 1) {
    throw new Error("Usage: create-next-repo my-repo");
  }

  const repoName = input[0];

  if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(repoName)) {
    throw new Error("Please use a lower-kebab-case for your repo name");
  }

  const cwd = process.cwd();
  const targetDir = path.join(cwd, repoName);

  if (flags.update) {
    update(repoName, targetDir);
  } else {
    create(repoName, targetDir, flags);
  }

  console.log();
  console.log(
    chalk.green(
      "No worries! Please remember to go to your repo dir and run `yarn`."
    )
  );
}
