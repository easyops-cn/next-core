import path from "path";
import fs from "fs-extra";
import globby from "globby";
import chalk from "chalk";
import { getAstOfFile } from "./getAstOfFile";
import { getSdkMapOfLocalToImported } from "./getSdkMapOfLocalToImported";
import {
  getMigrateMapOfImportNamespaceSpecifierToApiSet,
  getMigrateMapOfImportSpecifierToApiSet,
} from "./getMigrateMapOfImportedToApiSet";
import { migrateImportSpecifiers } from "./migrateImportSpecifiers";
import {
  migrateUsageOfLocalName,
  migrateUsageOfNamespace,
} from "./migrateUsage";
import { getRegExpOfInvalidUsage } from "./getRegExpOfSdkUsage";

export function migrateSdk(dir: string): boolean {
  let migrated = false;
  const tsFiles = globby.sync([
    path.posix.join(dir, "/{libs,bricks}/*/src/**/*.{ts,tsx}"),
    path.posix.join(dir, "/shared/**/*.{ts,tsx}"),
  ]);

  for (const filePath of tsFiles) {
    const source = fs.readFileSync(filePath, "utf-8");
    const ast = getAstOfFile(source, filePath);
    const {
      sdkMapOfLocalNameToImportedName,
      sdkNamespaceSet,
    } = getSdkMapOfLocalToImported(ast);

    if (
      sdkMapOfLocalNameToImportedName.size === 0 &&
      sdkNamespaceSet.size === 0
    ) {
      continue;
    }

    const invalidMatches = source.match(
      getRegExpOfInvalidUsage(sdkMapOfLocalNameToImportedName, sdkNamespaceSet)
    );
    if (invalidMatches) {
      console.error(invalidMatches);
      throw new Error("Invalid sdk usage");
    }

    const migrateMapOfImportSpecifierToApiSet = getMigrateMapOfImportSpecifierToApiSet(
      source,
      sdkMapOfLocalNameToImportedName
    );

    const migrateMapOfImportNamespaceSpecifierToApiSet = getMigrateMapOfImportNamespaceSpecifierToApiSet(
      source,
      sdkNamespaceSet
    );

    let newSource = migrateImportSpecifiers(
      source,
      ast,
      migrateMapOfImportSpecifierToApiSet,
      migrateMapOfImportNamespaceSpecifierToApiSet
    );

    newSource = migrateUsageOfLocalName(
      newSource,
      sdkMapOfLocalNameToImportedName
    );

    newSource = migrateUsageOfNamespace(newSource, sdkNamespaceSet);

    if (source !== newSource) {
      fs.writeFileSync(filePath, newSource);
      console.log("Migrated:", `./${path.relative(dir, filePath)}`);
      migrated = true;
    } else {
      console.error(chalk.red(`Missed: ./${path.relative(dir, filePath)}`));
      if (sdkMapOfLocalNameToImportedName.size > 0) {
        console.error(Array.from(sdkMapOfLocalNameToImportedName.values()));
      }
      if (sdkNamespaceSet.size > 0) {
        console.error(Array.from(sdkNamespaceSet));
      }
    }
  }
  return migrated;
}
