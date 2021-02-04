import chalk from "chalk";
import path from "path";
import { replaceInFile } from "replace-in-file";
import { customConsole, LogLevel } from "../customConsole";

export function replaceInternalScopes(dest: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    customConsole.log(
      LogLevel.VERBOSE,
      chalk.gray(`  > Replacing by internal scopes ...`)
    );
    replaceInFile({
      files: [path.join(dest, "package.json"), path.join(dest, ".pkgbuild/**")],
      from: [
        /@next-bricks\//g,
        /@next-legacy-templates\//g,
        /@next-libs\//g,
        /@next-micro-apps\//g,
      ],
      to: ["@bricks/", "@templates/", "@libs/", "@micro-apps/"],
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
