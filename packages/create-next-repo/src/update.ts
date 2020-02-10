// File System, hard to test for now.
/* istanbul ignore file */
import path from "path";
import fs from "fs-extra";
import chalk from "chalk";
import semver from "semver";
import prettier from "prettier";
import * as changeCase from "change-case";
import {
  getPackageJson,
  replaceFileContent,
  devDependenciesCopyMap
} from "./utils";

const caretRangesRegExp = /^\^\d+\.\d+\.\d+$/;

export function update(repoName: string, targetDir: string): void {
  if (!fs.existsSync(targetDir)) {
    throw new Error(`Target directory not exists: ${targetDir}`);
  }

  const cwd = process.cwd();
  const packageJson = getPackageJson();
  const targetPackageJsonPath = path.join(targetDir, "package.json");
  const targetPackageJson = JSON.parse(
    fs.readFileSync(targetPackageJsonPath, "utf8")
  );
  const targetCurrentGeneratorVersion =
    targetPackageJson.easyops?.["create-next-repo"] ?? "0.4.10";
  const newFilesFromTemplates: string[] = [];
  const overwriteFilesFromTemplates: string[] = [];
  const templateDir = path.join(__dirname, "../template");

  const translations: Record<string, string> = {
    "$kebab-repo-name$": changeCase.paramCase(repoName),
    "$Title Repo Name$": changeCase.capitalCase(repoName),
    "$generator.version$": `v${packageJson.version}`
  };

  if (semver.gte(targetCurrentGeneratorVersion, packageJson.version)) {
    console.log(
      `Current create-next-repo version in target: ${targetCurrentGeneratorVersion} is >= cli version: ${packageJson.version}`
    );
    return;
  }

  if (semver.lt(targetCurrentGeneratorVersion, "0.5.0")) {
    addFeatureSyncDll();
    newFilesFromTemplates.push("scripts/sync-dll.js");
  }

  if (semver.lt(targetCurrentGeneratorVersion, "0.6.0")) {
    overwriteFilesFromTemplates.push("README.md");
  }

  if (semver.lt(targetCurrentGeneratorVersion, "0.6.2")) {
    overwriteFilesFromTemplates.push(".gitignore");
  }

  syncPackageJson();
  syncFiles(newFilesFromTemplates, "new");
  syncFiles(overwriteFilesFromTemplates, "overwrite");

  function addFeatureSyncDll(): void {
    targetPackageJson.scripts["sync-dll"] = "node scripts/sync-dll.js";
  }

  function syncPackageJson() {
    // 1. Update `easyops.create-next-repo` in `package.json`
    if (!targetPackageJson.easyops) {
      targetPackageJson.easyops = {};
    }
    targetPackageJson.easyops["create-next-repo"] = packageJson.version;

    // 1. Update `devDependencies` in `package.json`
    for (const [type, deps] of Object.entries(devDependenciesCopyMap)) {
      for (const dep of deps) {
        const fromVersion = targetPackageJson.devDependencies[dep];
        const toVersion = packageJson[type][dep];
        if (fromVersion) {
          if (
            caretRangesRegExp.test(fromVersion) &&
            caretRangesRegExp.test(toVersion)
          ) {
            if (semver.gte(fromVersion.substr(1), toVersion.substr(1))) {
              // Ignore newer dependencies.
              continue;
            }
          }
        }
        targetPackageJson.devDependencies[dep] = toVersion;
      }
    }

    fs.outputFileSync(
      targetPackageJsonPath,
      prettier.format(JSON.stringify(targetPackageJson), {
        parser: "json"
      })
    );
    console.log(
      `${chalk.bold("File updated")}: ./${path.relative(
        cwd,
        targetPackageJsonPath
      )}`
    );
  }

  function syncFiles(files: string[], type: "new" | "overwrite"): void {
    const newFiles = files.map(filePath => [
      path.join(targetDir, filePath),
      replaceFileContent(path.join(templateDir, filePath), translations)
    ]);
    for (const [filePath, content] of newFiles) {
      fs.outputFileSync(filePath, content);
      console.log(
        `${chalk.bold(
          type === "new" ? "File created" : "File updated"
        )}: ./${path.relative(cwd, filePath)}`
      );
    }
  }
}
