import chalk from "chalk";
import path from "path";
import { replaceInFile } from "replace-in-file";
import { customConsole, LogLevel } from "../customConsole";

export function replaceCommentSectionsInWorkflows(dest: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    customConsole.log(
      LogLevel.VERBOSE,
      chalk.gray(`  > Replacing comment sections in workflows ...`)
    );
    replaceInFile({
      files: path.join(dest, ".github/workflows/ci.yml"),
      from: /^ +# - name: Coveralls(\n^ +# .*$)+/gim,
      to: (match) => match.replace(/^( +)# /gm, "$1"),
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
