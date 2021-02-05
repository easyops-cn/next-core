import inquirer from "inquirer";
import { StoryboardFormat } from "../interface";

export function askStoryboardFormat(): inquirer.ListQuestion<{
  storyboardFormat: StoryboardFormat;
}> {
  // istanbul ignore next (nothing logic)
  return {
    type: "list",
    name: "storyboardFormat",
    message: "Which format do you prefer for your storyboard?",
    choices: [
      StoryboardFormat.YAML,
      StoryboardFormat.JSON,
      StoryboardFormat.TYPESCRIPT,
    ],
  };
}
