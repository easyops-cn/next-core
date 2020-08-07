import fs from "fs";
import path from "path";
import inquirer from "inquirer";

export function askProcessorName({
  packageName,
  appRoot,
}: {
  packageName: string;
  appRoot: string;
}): inquirer.DistinctQuestion<{ processorName: string }> {
  return {
    type: "input",
    name: "processorName",
    message: `What's the name of your custom processor (in camelCase)?`,
    validate(value) {
      const pass = /^[a-z][a-zA-Z0-9]*$/.test(value);
      if (!pass) {
        return "Please enter a camelCase processor name.";
      }

      const relativePath = path.join(
        "bricks",
        packageName,
        "src/custom-processors",
        `${value}.ts`
      );
      const filePath = path.join(appRoot, relativePath);
      if (fs.existsSync(filePath)) {
        return `Custom processor "${relativePath}" exists, please enter another name.`;
      }

      return true;
    },
  };
}
