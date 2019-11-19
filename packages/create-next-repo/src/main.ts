// File System, hard to test for now.
/* istanbul ignore file */
import path from "path";
import fs from "fs-extra";
import chalk from "chalk";
import meow from "meow";
import { loadTemplate } from "./loaders/loadTemplate";

const { input } = meow({});

export async function create(): Promise<void> {
  if (input.length !== 1) {
    throw new Error("Usage: create-next-repo my-repo");
  }

  const repoName = input[0];

  if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(repoName)) {
    throw new Error("Please use a lower-kebab-case for your repo name");
  }

  const cwd = process.cwd();
  const targetDir = path.join(cwd, repoName);
  if (fs.existsSync(targetDir)) {
    throw new Error(`Target directory exists: ${targetDir}`);
  }

  const files = loadTemplate(repoName, targetDir);

  for (const [filePath, content] of files) {
    fs.outputFileSync(filePath, content);
    console.log(
      `${chalk.bold("File created")}: ./${path.relative(cwd, filePath)}`
    );
  }

  console.log();
  console.log(
    chalk.green(
      "No worries! Please remember to go to your repo dir and run `yarn`."
    )
  );
}
