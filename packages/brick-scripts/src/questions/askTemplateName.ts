import fs from "fs";
import path from "path";
import inquirer from "inquirer";
import { TargetType } from "../interface";

export function askTemplateName({
  targetType,
  packageName,
  appRoot
}: {
  targetType: TargetType;
  packageName: string;
  appRoot: string;
}): inquirer.DistinctQuestion<{ templateName: string }> {
  return {
    type: "input",
    name: "templateName",
    message: `What's the name of your ${
      targetType === TargetType.A_NEW_PACKAGE_OF_BRICKS ? "first" : "new"
    } template (in lower-kebab-case)?`,
    validate(value) {
      const pass = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(value);
      if (!pass) {
        return "Please enter a lower-kebab-case template name.";
      }

      const relativePath = path.join(
        "templates",
        packageName,
        "src",
        `${value}.ts`
      );
      const filePath = path.join(appRoot, relativePath);
      if (fs.existsSync(filePath)) {
        return `Template "${relativePath}" exists, please enter another name.`;
      }

      return true;
    }
  };
}
