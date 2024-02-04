import chalk from "chalk";
import path from "path";
import fs from "fs-extra";
import { customConsole, LogLevel } from "../customConsole";

export function patchInternalRenovate(dest: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    customConsole.log(
      LogLevel.VERBOSE,
      chalk.gray(`  > Patching renovate only for internal repos ...`)
    );

    const renovateJsonPath = path.join(dest, "renovate.json");
    const renovateJson = fs.readJsonSync(renovateJsonPath);

    const nextCoreGroup = renovateJson.packageRules.find(
      (item) => item.groupName === "next-core packages"
    );

    nextCoreGroup.postUpgradeTasks = {
      commands: [
        "yarn renew",
        "yarn extract",
        "./node_modules/.bin/prettier --write package.json",
        "yarn-deduplicate yarn.lock",
        "yarn",
      ],
      executionMode: "branch",
      fileFilters: [
        "**/*",
        ".gitignore",
        ".gitlab/**/*",
        ".huskyrc",
        ".husky/.gitignore",
        ".husky/**/*",
      ],
    };

    fs.writeJsonSync(renovateJsonPath, renovateJson, {
      spaces: 2,
    });

    customConsole.log(
      LogLevel.VERBOSE,
      chalk.gray(`  > Patched successfully!`)
    );

    resolve();
  });
}
