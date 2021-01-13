import inquirer from "inquirer";
import { TargetType } from "./interface";
import { askTargetType } from "./questions/askTargetType";
import { askPackageName } from "./questions/askPackageName";
import { askBrickName } from "./questions/askBrickName";
import { askTemplateName } from "./questions/askTemplateName";
import { askProcessorName } from "./questions/askProcessorName";
import { askEditorBrickName } from "./questions/askEditorBrickName";
import { ask } from "./ask";
import { getEasyopsConfig } from "./getEasyopsConfig";

jest.mock("./getEasyopsConfig");
(getEasyopsConfig as jest.Mock).mockReturnValue({
  contractYamlDir: "easyops",
  contractUrl: "https://github.com/easyops-cn/contract-center.git",
  useLocalSdk: true,
});

jest.mock("inquirer");
jest.mock("./questions/askTargetType");
jest.mock("./questions/askPackageName");
jest.mock("./questions/askBrickName");
jest.mock("./questions/askTemplateName");
jest.mock("./questions/askProcessorName");
jest.mock("./questions/askEditorBrickName");

const spyOnAskTargetType = askTargetType as jest.Mock;
const spyOnAskPackageName = askPackageName as jest.Mock;
const spyOnAskBrickName = askBrickName as jest.Mock;
const spyOnAskTemplateName = askTemplateName as jest.Mock;
const spyOnAskProcessorName = askProcessorName as jest.Mock;
const spyOnAskEditorBrickName = askEditorBrickName as jest.Mock;

describe("ask", () => {
  beforeEach(() => {
    jest.spyOn(inquirer, "prompt").mockImplementation((v: any) => v || {});
    jest.spyOn(console, "log").mockImplementation(() => void 0);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test.each<[TargetType, string, string, string, string, string]>([
    [TargetType.A_NEW_BRICK, "package-a", "brick-a", "", "", ""],
    [TargetType.A_NEW_EDITOR_BRICK, "package-a", "", "", "", "brick-a"],
    [
      TargetType.A_NEW_CUSTOM_PROVIDER_BRICK,
      "package-a",
      "brick-b",
      "",
      "",
      "",
    ],
    [TargetType.A_NEW_CUSTOM_PROCESSOR, "package-a", "", "", "doSomething", ""],
    [TargetType.A_NEW_PACKAGE_OF_LIBS, "lib-a", "", "", "", ""],
    [TargetType.A_NEW_LEGACY_TEMPLATE, "package-b", "", "template-b", "", ""],
  ])(
    "should return { targetType: '%s', packageName: '%s', brickName: '%s', templateName: '%s', processorName: '%s' }",
    async (
      targetType,
      packageName,
      brickName,
      templateName,
      processorName,
      editorBrickName
    ) => {
      spyOnAskTargetType.mockReturnValue({ targetType });
      spyOnAskPackageName.mockReturnValue({ packageName });
      spyOnAskBrickName.mockReturnValue({ brickName });
      spyOnAskTemplateName.mockReturnValue({ templateName });
      spyOnAskProcessorName.mockReturnValue({ processorName });
      spyOnAskEditorBrickName.mockReturnValue({ brickName: editorBrickName });

      expect(await ask("")).toEqual({
        targetType,
        packageName,
        brickName: editorBrickName || brickName,
        templateName,
        processorName,
      });
    }
  );

  it("should use specified type", async () => {
    spyOnAskTargetType.mockReturnValue({ choices: [{ value: "libs" }] });

    expect(await ask("", { type: "libs" })).toMatchObject({
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
