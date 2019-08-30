import fs from "fs";
import inquirer from "inquirer";

export const getModules = (apiDir: string): string[] => {
  const modules: string[] = [];

  fs.readdirSync(apiDir, { withFileTypes: true }).forEach(dirent => {
    if (dirent.isDirectory()) {
      modules.push(dirent.name);
    }
  });

  return modules;
};

export const promptToChooseSdk = async (
  modules: string[]
): Promise<string[]> => {
  const props: { service: string } = await inquirer.prompt([
    {
      type: "list",
      name: "service",
      message:
        "Which sdk would you like to update? (ALL to update all @sdk/*-sdk)",
      choices: [...modules, "ALL"],
      default: 0
    }
  ]);

  return props.service === "ALL" ? modules : [props.service];
};
