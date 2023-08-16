import path from "node:path";
import fs from "fs-extra";
import chalk from "chalk";
import * as changeCase from "change-case";
import { getEasyopsConfig } from "@next-core/repo-config";
import { PUBLIC_SCOPED_SDK } from "@next-core/public-scoped-sdk";
import { loadService } from "./loaders/loadService.js";
import { loadTemplate } from "./loaders/loadTemplate.js";
import { clone, checkout } from "./contractGit.js";
import { promptToChooseSdk, getModules } from "./prompt.js";
import { apiDir } from "./loaders/env.js";
import { clearGlobalInterfaces } from "./lib/internal.js";

interface Flags {
  sdk: string;
}
export async function main(tagOrCommit = "", flags?: Flags): Promise<void> {
  const selectedSdk = flags.sdk;
  console.log("git cloning ...");
  try {
    await clone(tagOrCommit);
  } catch (code) {
    console.error(chalk.red("git clone failed"));
    process.exitCode = typeof code === "number" && code !== 0 ? code : 2;
  }

  console.log("git clone done");

  try {
    await checkout(tagOrCommit);
  } catch (code) {
    console.error(chalk.red(`tag or commit '${tagOrCommit}' not exists`));
    process.exitCode = typeof code === "number" && code !== 0 ? code : 2;
  }

  const modules = getModules(apiDir);
  if (selectedSdk) {
    await create(changeCase.snakeCase(selectedSdk));
  } else {
    const choices = await promptToChooseSdk(modules);
    for (const m of choices) {
      await create(m);
    }
  }
}

async function create(serviceName: string): Promise<void> {
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
    await loadService(serviceName).toFiles(sdkRoot)
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
