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
      source: (_, input) => {
        const choices = input
          ? ((question as inquirer.ListQuestion).choices as string[]).filter(
              (item) => item.includes(input)
            )
          : (question as inquirer.ListQuestion).choices;
        if ((choices as string[]).length === 0) {
          return Promise.resolve([input]);
        }
        return Promise.resolve(choices);
      },
    } as any;
  }

  return question;
}
