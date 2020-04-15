import fs from "fs";
import path from "path";
import inquirer from "inquirer";
import { TargetType } from "../interface";
import * as changeCase from "change-case";

export function askBrickName({
  targetType,
  packageName,
  appRoot
}: {
  targetType: TargetType;
  packageName: string;
  appRoot: string;
}): inquirer.DistinctQuestion<{ brickName: string }> {
  return {
    type: "input",
    name: "brickName",
    message: `What's the name of your ${
      targetType === TargetType.A_NEW_PACKAGE_OF_BRICKS ? "first" : "new"
    } ${
      targetType === TargetType.A_NEW_CUSTOM_TEMPLATE
        ? "custom template"
        : "brick"
    } (in lower-kebab-case${
      targetType === TargetType.A_NEW_CUSTOM_TEMPLATE
        ? ", recommend prefix with `tpl-`"
        : ""
    })?`,
    default() {
      if (packageName.includes("-")) {
        return packageName;
      }
      if (targetType === TargetType.A_NEW_PACKAGE_OF_BRICKS) {
        return `${packageName}-index`;
      }
    },
    validate(value) {
      const pass = /^[a-z][a-z0-9]*(-[a-z0-9]+)+$/.test(value);
      if (!pass) {
        return "Please enter a lower-kebab-case name (and must include a `-`).";
      }
      const pkgRelativeDir = path.join("bricks", packageName);
      const relativeFilePath =
        targetType === TargetType.A_NEW_CUSTOM_PROVIDER_BRICK
          ? path.join(
              pkgRelativeDir,
              "src/data-providers",
              `${changeCase.pascalCase(value)}.ts`
            )
          : targetType === TargetType.A_NEW_CUSTOM_TEMPLATE
          ? path.join(pkgRelativeDir, "src/custom-templates", `${value}.ts`)
          : path.join(pkgRelativeDir, "src", value);
      const root = path.join(appRoot, relativeFilePath);
      if (fs.existsSync(root)) {
        return `Directory or file "${relativeFilePath}" exists, please enter another name.`;
      }

      return true;
    },
    transformer(value) {
      if (targetType === TargetType.A_NEW_CUSTOM_PROVIDER_BRICK) {
        return `provider-${value}`;
      }
      return value;
    }
  };
}
