import chalk from "chalk";
import path from "path";
import fs from "fs-extra";
import { customConsole, LogLevel } from "../customConsole";

export function patchInternalTemplate(dest: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    customConsole.log(
      LogLevel.VERBOSE,
      chalk.gray(`  > Removing files only for public repos ...`)
    );
    // Remove `.github`, etc.
    fs.removeSync(path.join(dest, ".github"));
    fs.removeSync(path.join(dest, ".easyops-yo.json"));
    fs.removeSync(path.join(dest, "COPYING"));
    customConsole.log(
      LogLevel.VERBOSE,
      chalk.gray(`  > Removed successfully!`)
    );

    const packageJsonPath = path.join(dest, "package.json");
    fs.writeJsonSync(packageJsonPath, {
      ...fs.readJSONSync(packageJsonPath),
      license: "UNLICENSED",
    });

    customConsole.log(
      LogLevel.VERBOSE,
      chalk.gray(`  > Creating files only for internal repos ...`)
    );
    // Add `.gitlab`, etc.
    const internalTemplateDir = path.join(__dirname, "../../template/internal");
    fs.copy(internalTemplateDir, dest, (err) => {
      if (err) {
        customConsole.error(
          LogLevel.VERBOSE,
          chalk.red(`  > Failed to create!`)
        );
        reject(err);
      } else {
        customConsole.log(
          LogLevel.VERBOSE,
          chalk.gray(`  > Created successfully!`)
        );
        resolve();
      }
    });
  });
}
