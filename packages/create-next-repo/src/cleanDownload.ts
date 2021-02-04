import fs from "fs";
import chalk from "chalk";
import { customConsole, LogLevel } from "./customConsole";

export function cleanDownload(filePath: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    customConsole.log(
      LogLevel.VERBOSE,
      chalk.gray(`Cleaning temporary file ...`)
    );
    fs.unlink(filePath, (err) => {
      if (err) {
        customConsole.error(
          LogLevel.VERBOSE,
          chalk.red(`Failed to clean file ${filePath}!`)
        );
        reject(err);
      } else {
        customConsole.log(
          LogLevel.VERBOSE,
          chalk.gray("Cleaned successfully!")
        );
        resolve();
      }
    });
  });
}
