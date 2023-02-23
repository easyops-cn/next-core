import fs from "node:fs";
import inquirer from "inquirer";
import * as changeCase from "change-case";
import { getEasyopsConfig } from "@next-core/repo-config";
import { PUBLIC_SCOPED_SDK } from "@next-core/public-scoped-sdk";

export const getModules = (apiDir: string): string[] => {
  const { usePublicScope } = getEasyopsConfig();
  const modules: string[] = [];

  fs.readdirSync(apiDir, { withFileTypes: true }).forEach((dirent) => {
    if (dirent.isDirectory()) {
      const isPublicScopedSdk = PUBLIC_SCOPED_SDK.includes(
        changeCase.paramCase(dirent.name)
      );
      const allowed = usePublicScope ? isPublicScopedSdk : !isPublicScopedSdk;
      if (allowed) {
        modules.push(dirent.name);
      }
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
        "Which sdk would you like to update? (ALL to update all sdk/*-sdk)",
      choices: [...modules, "ALL"],
      default: 0,
    },
  ]);

  return props.service === "ALL" ? modules : [props.service];
};
