import inquirer from "inquirer";
import { getEasyopsConfig } from "@next-core/repo-config";
import { TargetType } from "./interface";
import { askTargetType } from "./questions/askTargetType";
import { askPackageName } from "./questions/askPackageName";
import { askBrickName } from "./questions/askBrickName";
import { askProcessorName } from "./questions/askProcessorName";
import { ask } from "./ask";

jest.mock("inquirer");
jest.mock("@next-core/repo-config");
jest.mock("./questions/askTargetType");
jest.mock("./questions/askPackageName");
jest.mock("./questions/askBrickName");
jest.mock("./questions/askProcessorName");

(getEasyopsConfig as jest.Mock).mockReturnValue({
  useLocalSdk: true,
});

const spyOnAskTargetType = askTargetType as jest.Mock;
const spyOnAskPackageName = askPackageName as jest.Mock;
const spyOnAskBrickName = askBrickName as jest.Mock;
const spyOnAskProcessorName = askProcessorName as jest.Mock;

describe("ask", () => {
  beforeEach(() => {
    jest.spyOn(inquirer, "prompt").mockImplementation((v: any) => v || {});
    jest.spyOn(console, "log").mockImplementation(() => void 0);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test.each<[TargetType, string, string, string, string]>([
    [TargetType.A_NEW_BRICK, "package-a", "brick-a", "", ""],
    [TargetType.A_NEW_CUSTOM_PROVIDER, "package-a", "brick-b", "", ""],
    [TargetType.A_NEW_CUSTOM_PROCESSOR, "package-a", "", "doSomething", ""],
    [TargetType.A_NEW_PACKAGE_OF_LIBS, "lib-a", "", "", ""],
  ])(
    "should return { targetType: '%s', packageName: '%s', brickName: '%s', processorName: '%s' }",
    async (
      targetType,
      packageName,
      brickName,
      processorName,
      editorBrickName
    ) => {
      spyOnAskTargetType.mockReturnValue({ targetType });
      spyOnAskPackageName.mockReturnValue({ packageName });
      spyOnAskBrickName.mockReturnValue({ brickName });
      spyOnAskProcessorName.mockReturnValue({ processorName });

      expect(await ask("")).toEqual({
        targetType,
        packageName,
        brickName: editorBrickName || brickName,
        processorName,
      });
    }
  );

  it("should use specified type", async () => {
    spyOnAskTargetType.mockReturnValue({ choices: [{ value: "libs" }] });

    expect(
      await ask("", { type: TargetType.A_NEW_PACKAGE_OF_LIBS })
    ).toMatchObject({
      targetType: "libs",
    });
  });

  it("should throw error if use invalid type", async () => {
    expect.assertions(1);
    spyOnAskTargetType.mockReturnValue({ choices: [{ value: "libs" }] });
    try {
      await ask("", { type: "not-existed" } as any);
    } catch (error) {
      expect(error.message).toContain("Invalid type");
    }
  });
});
