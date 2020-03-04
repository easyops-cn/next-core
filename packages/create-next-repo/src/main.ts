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
      type: "boolean",
      alias: "u"
    },
    install: {
      type: "boolean",
      default: true
    }
  }
});

export async function main(): Promise<void> {
  if (input.length !== 1) {
    throw new Error("Usage: create-next-repo my-repo");
  }

  const targetDir = path.resolve(input[0]);
  const repoName = path.basename(targetDir);

  if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(repoName)) {
    throw new Error("Please use a lower-kebab-case for your repo name");
  }

  if (flags.update) {
    await update(repoName, targetDir, flags);
  } else {
    await create(repoName, targetDir, flags);
  }

  console.log();
  console.log(chalk.green("No worries!"));
}
