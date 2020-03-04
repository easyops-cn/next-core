// File System, hard to test for now.
/* istanbul ignore file */
import path from "path";
import fs from "fs-extra";
import chalk from "chalk";
import { loadTemplate } from "./loaders/loadTemplate";
import { scriptYarnInstall } from "./scripts";

export async function create(
  repoName: string,
  targetDir: string,
  flags: { internal?: boolean; install?: boolean }
): Promise<void> {
  if (fs.existsSync(targetDir)) {
    throw new Error(`Target directory exists: ${targetDir}`);
  }

  console.log(chalk.inverse("[create-next-repo]"));

  const cwd = process.cwd();
  const files = loadTemplate(repoName, targetDir, flags);

  for (const [filePath, content] of files) {
    fs.outputFileSync(filePath, content);
    console.log(
      `${chalk.bold("File created")}: ./${path.relative(cwd, filePath)}`
    );
  }

  if (flags.install) {
    await scriptYarnInstall(targetDir);
  }
}
