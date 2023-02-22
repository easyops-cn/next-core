import { describe, it, expect } from "@jest/globals";
import inquirer from "inquirer";
import { getModules, promptToChooseSdk } from "./prompt.js";
import { apiDir } from "./loaders/env.js";

jest.mock("./loaders/__dirname.js");
jest.mock("@next-core/repo-config", () => ({
  getEasyopsConfig: () => ({
    usePublicScope: false,
    contractYamlDir: "easyops",
  }),
}));

describe("prompt should work", () => {
  it("getModules should work", () => {
    const modules = getModules(apiDir);
    expect(modules.includes("cd")).toBe(true);
  });

  it("promptToChooseSdk should work", async () => {
    jest
      .spyOn(inquirer, "prompt")
      // @ts-ignore
      .mockReturnValue(new Promise((resolve) => resolve({ service: "cd" })));
    const modules = ["artifact", "cd"];
    let result = await promptToChooseSdk(modules);

    jest
      .spyOn(inquirer, "prompt")
      // @ts-ignore
      .mockReturnValue(new Promise((resolve) => resolve({ service: "ALL" })));
    result = await promptToChooseSdk(modules);
    expect(result).toEqual(modules);
  });
});
