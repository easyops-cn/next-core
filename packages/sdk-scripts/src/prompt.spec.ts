import inquirer from "inquirer";
import { getModules, promptToChooseSdk } from "./prompt";
import { apiDir } from "./loaders/env";

describe("promt should work", () => {
  it("getModules should work", () => {
    const modules = getModules(apiDir);
    expect(modules.includes("cd")).toBe(true);
  });

  it("promptToChooseSdk should work", async () => {
    jest
      .spyOn(inquirer, "prompt")
      // @ts-ignore
      .mockReturnValue(new Promise(resolve => resolve({ service: "cd" })));
    const modules = ["artifact", "cd"];
    let result = await promptToChooseSdk(modules);

    jest
      .spyOn(inquirer, "prompt")
      // @ts-ignore
      .mockReturnValue(new Promise(resolve => resolve({ service: "ALL" })));
    result = await promptToChooseSdk(modules);
    expect(result).toEqual(modules);
  });
});
