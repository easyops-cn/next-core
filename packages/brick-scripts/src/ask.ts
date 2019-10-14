import inquirer from "inquirer";
import chalk from "chalk";
import { TargetType, AskFlags } from "./interface";
import { askTargetType } from "./questions/askTargetType";
import { askPackageName } from "./questions/askPackageName";
import { askBrickName } from "./questions/askBrickName";
import { askTemplateName } from "./questions/askTemplateName";

export async function ask(
  appRoot: string,
  flags?: AskFlags
): Promise<{
  targetType: TargetType;
  packageName: string;
  brickName: string;
  templateName: string;
}> {
  const questionOfTargetType = askTargetType();
  let targetType: TargetType;
  if (flags && flags.type) {
    // Specified in command line arguments
    const choices: {
      name: string;
      value: string;
    }[] = questionOfTargetType.choices as any;
    const matchedChoice = choices.find(choice => choice.value === flags.type);
    if (matchedChoice) {
      console.log(
        `${chalk.green("?")} ${chalk.bold(
          questionOfTargetType.message as string
        )} ${chalk.cyan(matchedChoice.name)}`
      );
    } else {
      throw new Error(
        `Invalid type, allowed types: ${choices
          .map(choice => choice.value)
          .join(", ")}`
      );
    }
    targetType = flags.type as TargetType;
  } else {
    targetType = (await inquirer.prompt(questionOfTargetType)).targetType;
  }

  const { packageName } = await inquirer.prompt(
    askPackageName({ targetType, appRoot })
  );
  let brickName = "";
  let templateName = "";
  if (
    [TargetType.A_NEW_BRICK, TargetType.A_NEW_PACKAGE_OF_BRICKS].includes(
      targetType
    )
  ) {
    // 如果是新建构件/构件库，额外询问新构件的名字。
    brickName = (await inquirer.prompt(
      askBrickName({
        targetType,
        packageName,
        appRoot
      })
    )).brickName;
  } else if (
    [TargetType.A_NEW_TEMPLATE, TargetType.A_NEW_PACKAGE_OF_TEMPLATES].includes(
      targetType
    )
  ) {
    // 如果是新建模板/模板库，额外询问新模板的名字。
    templateName = (await inquirer.prompt(
      askTemplateName({
        targetType,
        packageName,
        appRoot
      })
    )).templateName;
  }

  return {
    targetType,
    packageName,
    brickName,
    templateName
  };
}
