import chalk from "chalk";
import path from "path";
import { replaceInFile } from "replace-in-file";
import { customConsole, LogLevel } from "../customConsole";

export function replaceInternalBadges(dest: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    customConsole.log(
      LogLevel.VERBOSE,
      chalk.gray(`  > Replacing by internal badges ...`)
    );
    replaceInFile({
      files: path.join(dest, "README.md"),
      from: [
        /\[!\[CI Status\]\(.*?\)\]\(.*?\)/i,
        /\[!\[Coverage Status\]\(.*?\)\]\(.*?\)/i,
      ],
      to: [
        "[![CI Status](https://git.easyops.local/anyclouds/YOUR-REPOSITORY/badges/master/pipeline.svg)](https://git.easyops.local/anyclouds/YOUR-REPOSITORY/commits/master)",
        "[![Coverage Status](https://git.easyops.local/anyclouds/YOUR-REPOSITORY/badges/master/coverage.svg)](https://git.easyops.local/anyclouds/YOUR-REPOSITORY/commits/master)",
      ],
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
