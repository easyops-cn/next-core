import chalk from "chalk";
import path from "path";
import { replaceInFile } from "replace-in-file";
import { customConsole, LogLevel } from "../customConsole";

export function replaceCommentSectionsInReadme(dest: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    customConsole.log(
      LogLevel.VERBOSE,
      chalk.gray(`  > Replacing comment sections in README.md ...`)
    );
    replaceInFile({
      files: path.join(dest, "README.md"),
      from: [
        /<!-- Uncomment .*?(^.*?)-->\n/gims,
        /^\*\*Please change.*?\*\*\n+/gims,
      ],
      to: ["$1", ""],
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
