import chalk from "chalk";
import path from "path";
import { replaceInFile } from "replace-in-file";
import { customConsole, LogLevel } from "../customConsole";

export function replaceYourRepository(dest: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const repoName = path.basename(dest);
    customConsole.log(
      LogLevel.VERBOSE,
      chalk.gray(`  > Replacing "YOUR-REPOSITORY" by "${repoName}" ...`)
    );
    replaceInFile({
      files: [path.join(dest, "package.json"), path.join(dest, "README.md")],
      from: /\bYOUR-REPOSITORY\b/g,
      to: repoName,
    })
      .then(() => {
        customConsole.log(
          LogLevel.VERBOSE,
          chalk.gray(`  > Replaced successfully!`)
        );
        resolve();
      })
      .catch((err) => {
        customConsole.error(
          LogLevel.VERBOSE,
          chalk.red(`  > Failed to replace!`)
        );
        reject(err);
      });
  });
}
