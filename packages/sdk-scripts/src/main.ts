import path from "path";
import fs from "fs-extra";
import chalk from "chalk";
import * as changeCase from "change-case";
import { getEasyopsConfig } from "@next-core/repo-config";
import { loadService } from "./loaders/loadService";
import { loadTemplate } from "./loaders/loadTemplate";
import { clone, checkout } from "./contractGit";
import { promptToChooseSdk, getModules } from "./prompt";
import { apiDir } from "./loaders/env";
import { clearGlobalInterfaces } from "./lib/internal";
import { PUBLIC_SCOPED_SDK } from "./constants";

interface Flags {
  sdk: string;
}
export async function main(tagOrCommit = "", flags?: Flags): Promise<void> {
  const selectedSdk = flags.sdk;
  console.log("git cloning ...");
  const result = clone();
  if (result.status !== 0) {
    console.error(chalk.red("git clone failed"));
    console.error(result.stderr);
    process.exit(result.status);
  }

  const code = checkout(tagOrCommit);
  if (code !== 0) {
    console.error(chalk.red(`tag or commit '${tagOrCommit}' not exists`));
    process.exit(code);
  }

  const modules = getModules(apiDir);
  if (selectedSdk) {
    create(changeCase.snakeCase(selectedSdk));
  } else {
    const choices = await promptToChooseSdk(modules);
    for (const m of choices) {
      create(m);
    }
  }
}

export function create(serviceName: string): void {
  const paramCaseSdkName = changeCase.paramCase(serviceName);
  const { usePublicScope } = getEasyopsConfig();
  const isPublicScopedSdk = PUBLIC_SCOPED_SDK.includes(paramCaseSdkName);
  const allowed = usePublicScope ? isPublicScopedSdk : !isPublicScopedSdk;
  if (!allowed) {
    throw new Error(
      usePublicScope
        ? `${paramCaseSdkName}-sdk are only allowed in the public repository`
        : `${paramCaseSdkName}-sdk are only allowed in the private repository`
    );
  }

  clearGlobalInterfaces();

  const sdkRoot = path.join(process.cwd(), "sdk", paramCaseSdkName + "-sdk");

  let sdkVersion;
  if (fs.existsSync(path.join(sdkRoot, "package.json"))) {
    const packageJson = fs.readJsonSync(path.join(sdkRoot, "package.json"));
    sdkVersion = packageJson.version;
  }
  const files = loadTemplate(serviceName, sdkRoot, sdkVersion).concat(
    loadService(serviceName).toFiles(sdkRoot)
  );

  const changelogMdPath = path.join(sdkRoot, "CHANGELOG.md");
  if (fs.existsSync(changelogMdPath)) {
    const content = fs.readFileSync(changelogMdPath, {
      encoding: "utf8",
    });
    files.push([changelogMdPath, content]);
  }

  // DANGER
  fs.emptyDirSync(sdkRoot);

  for (const [filePath, content] of files) {
    fs.outputFileSync(filePath, content);
    console.log(
      `${chalk.bold("File created")}: ./${path.relative(
        process.cwd(),
        filePath
      )}`
    );
  }

  console.log();
  console.log(chalk.green("No worries!"));
}
