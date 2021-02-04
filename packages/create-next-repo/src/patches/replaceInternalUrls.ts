import chalk from "chalk";
import path from "path";
import { replaceInFile } from "replace-in-file";
import { customConsole, LogLevel } from "../customConsole";

export function replaceInternalUrls(dest: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    customConsole.log(
      LogLevel.VERBOSE,
      chalk.gray(`  > Replacing by internal URLs ...`)
    );
    replaceInFile({
      files: [path.join(dest, "package.json"), path.join(dest, "README.md")],
      from: "https://github.com/easyops-cn/",
      to: "https://git.easyops.local/anyclouds/",
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
