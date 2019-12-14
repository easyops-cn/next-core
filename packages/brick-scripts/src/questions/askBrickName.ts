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
    } brick (in lower-kebab-case)?`,
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
        return "Please enter a lower-kebab-case brick name (and must include a `-`).";
      }
      const relativePath =
        targetType === TargetType.A_NEW_CUSTOM_PROVIDER_BRICK
          ? path.join(
              "bricks",
              packageName,
              "src",
              "data-providers",
              `${changeCase.pascalCase(value)}.ts`
            )
          : path.join("bricks", packageName, "src", value);
      const root = path.join(appRoot, relativePath);
      if (fs.existsSync(root)) {
        return `Brick "${relativePath}" exists, please enter another name.`;
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
