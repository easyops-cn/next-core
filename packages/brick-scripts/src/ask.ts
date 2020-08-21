import inquirer from "inquirer";
import chalk from "chalk";
import { TargetType, AskFlags } from "./interface";
import { askTargetType } from "./questions/askTargetType";
import { askPackageName } from "./questions/askPackageName";
import { askBrickName } from "./questions/askBrickName";
import { askTemplateName } from "./questions/askTemplateName";
import { askProcessorName } from "./questions/askProcessorName";
import { updateHistory } from "./loaders/loadHistory";

export async function ask(
  appRoot: string,
  flags?: AskFlags
): Promise<{
  targetType: TargetType;
  packageName: string;
  brickName: string;
  templateName: string;
  processorName: string;
}> {
  const questionOfTargetType = askTargetType();
  let targetType: TargetType;
  if (flags && flags.type) {
    // Specified in command line arguments
    const choices: {
      name: string;
      value: string;
    }[] = questionOfTargetType.choices as any;
    const matchedChoice = choices.find((choice) => choice.value === flags.type);
    if (matchedChoice) {
      console.log(
        `${chalk.green("?")} ${chalk.bold(
          questionOfTargetType.message as string
        )} ${chalk.cyan(matchedChoice.name)}`
      );
    } else {
      throw new Error(
        `Invalid type, allowed types: ${choices
          .map((choice) => choice.value)
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

  switch (targetType) {
    case TargetType.A_NEW_BRICK:
    case TargetType.A_NEW_CUSTOM_TEMPLATE:
    case TargetType.A_NEW_CUSTOM_PROVIDER_BRICK:
    case TargetType.A_NEW_CUSTOM_PROCESSOR:
    case TargetType.A_NEW_PACKAGE_OF_BRICKS:
      updateHistory({ lastSelectedBrickPackage: packageName });
      break;
    case TargetType.A_NEW_LEGACY_TEMPLATE:
    case TargetType.A_NEW_PACKAGE_OF_LEGACY_TEMPLATES:
      updateHistory({ lastSelectedTemplatePackage: packageName });
  }

  let createABrick = [
    TargetType.A_NEW_BRICK,
    TargetType.A_NEW_CUSTOM_TEMPLATE,
    TargetType.A_NEW_CUSTOM_PROVIDER_BRICK,
  ].includes(targetType);

  if (targetType === TargetType.A_NEW_PACKAGE_OF_BRICKS) {
    createABrick = (
      await inquirer.prompt({
        type: "confirm",
        name: "createABrick",
        message: "Would you like to create a brick at the same time?",
        default: true,
      })
    ).createABrick;
  }

  let brickName = "";
  let templateName = "";
  let processorName = "";
  if (createABrick) {
    // 如果是新建构件/新建自定义模板/新建自定义 Provider 构件/新建构件库，额外询问新构件的名字。
    brickName = (
      await inquirer.prompt(
        askBrickName({
          targetType,
          packageName,
          appRoot,
        })
      )
    ).brickName;
  } else if (
    [
      TargetType.A_NEW_LEGACY_TEMPLATE,
      TargetType.A_NEW_PACKAGE_OF_LEGACY_TEMPLATES,
    ].includes(targetType)
  ) {
    // 如果是新建模板/模板库，额外询问新模板的名字。
    templateName = (
      await inquirer.prompt(
        askTemplateName({
          targetType,
          packageName,
          appRoot,
        })
      )
    ).templateName;
  } else if (targetType === TargetType.A_NEW_CUSTOM_PROCESSOR) {
    processorName = (
      await inquirer.prompt(
        askProcessorName({
          packageName,
          appRoot,
        })
      )
    ).processorName;
  }

  return {
    targetType,
    packageName,
    brickName,
    templateName,
    processorName,
  };
}
