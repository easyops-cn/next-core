import fs from "fs-extra";
import path from "path";
import inquirer from "inquirer";
import { getEasyopsConfig } from "@next-core/repo-config";
import { TargetType } from "../interface";
import { targetMap } from "../constant";
import { translateListToAutocomplete } from "./translateListToAutocomplete";

interface AskPackageNameOptions {
  targetType: TargetType;
  appRoot: string;
}

function legacyAskPackageName({
  targetType,
  appRoot,
}: AskPackageNameOptions): inquirer.DistinctQuestion<{ packageName: string }> {
  const { useLocalSdk } = getEasyopsConfig();

  if (
    [
      TargetType.A_NEW_BRICK,
      TargetType.A_NEW_CUSTOM_TEMPLATE,
      TargetType.A_NEW_CUSTOM_PROVIDER,
      TargetType.A_NEW_CUSTOM_PROCESSOR,
    ].includes(targetType)
  ) {
    // 读取当前的 `bricks/*` 作为候选列表。
    const root = path.join(appRoot, "bricks");
    const pkgList = fs
      .readdirSync(root, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);

    return {
      type: "list",
      name: "packageName",
      message: `which package do you want to put the new ${
        targetType === TargetType.A_NEW_CUSTOM_TEMPLATE
          ? "custom template"
          : "brick"
      } in?`,
      choices: pkgList,
      // default: loadHistory().lastSelectedBrickPackage,
    };
  }

  if (targetType === TargetType.A_NEW_PACKAGE_OF_PROVIDERS) {
    // 读取所有的 `sdk/*` 作为候选列表。
    const root = path.join(
      appRoot,
      useLocalSdk ? "sdk" : "../next-providers/sdk"
    );
    const sdkList = fs
      .readdirSync(root, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => ({
        name: dirent.name,
        value: `providers-of-${dirent.name.replace(/-sdk$/, "")}`,
      }));

    return {
      type: "list",
      name: "packageName",
      message: "which sdk do you want to create providers for?",
      choices: sdkList,
    };
  }

  return {
    type: "input",
    name: "packageName",
    message: "What's the name of your new package (in lower-kebab-case)?",
    validate(value) {
      const pass = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(value);
      if (!pass) {
        return "Please enter a lower-kebab-case package name.";
      }

      if (targetType === TargetType.A_NEW_PACKAGE_OF_BRICKS) {
        const collision = value.startsWith("providers-of-");
        if (collision) {
          return "`providers-of-*` is reserved, please enter another name.";
        }
      }

      const relativePath = path.join(targetMap[targetType], value);
      const root = path.join(appRoot, relativePath);

      if (fs.existsSync(root)) {
        return `Package "${relativePath}" exists, please enter another name.`;
      }

      return true;
    },
  };
}

export function askPackageName(
  options: AskPackageNameOptions
): inquirer.DistinctQuestion<{ packageName: string }> {
  return translateListToAutocomplete(legacyAskPackageName(options));
}
