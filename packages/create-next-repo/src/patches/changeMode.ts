import path from "path";
import fs from "fs-extra";
import chalk from "chalk";
import { customConsole, LogLevel } from "../customConsole";

export async function changeMode(dest: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    customConsole.log(LogLevel.VERBOSE, chalk.gray(`  > Changing mode ...`));

    const fileToBeChanged = path.join(dest, ".husky/pre-commit");
    if (!fs.existsSync(fileToBeChanged)) {
      customConsole.warn(
        LogLevel.VERBOSE,
        chalk.yellow(`  > File to be changed doesn't exist.`)
      );

      resolve();
      return;
    }

    fs.chmod(fileToBeChanged, 0o755, (err) => {
      if (err) {
        customConsole.error(
          LogLevel.VERBOSE,
          chalk.red(`  > Failed to change mode!`)
        );

        reject(err);
      } else {
        customConsole.log(
          LogLevel.VERBOSE,
          chalk.gray(`  > Mode changed successfully!`)
        );

        resolve();
      }
    });
  });
}
