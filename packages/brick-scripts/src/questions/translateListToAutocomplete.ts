import inquirer from "inquirer";
import AutocompletePrompt from "inquirer-autocomplete-prompt";

export function translateListToAutocomplete<
  T extends inquirer.DistinctQuestion
>(question: T): T {
  if (question.type === "list") {
    inquirer.registerPrompt("autocomplete", AutocompletePrompt);

    return {
      type: "autocomplete" as any,
      name: question.name,
      message: question.message,
      default: question.default,
      source: (_, input) =>
        Promise.resolve(
          input
            ? ((question as inquirer.ListQuestion)
                .choices as string[]).filter((item) => item.includes(input))
            : (question as inquirer.ListQuestion).choices
        ),
    } as any;
  }

  return question;
}
