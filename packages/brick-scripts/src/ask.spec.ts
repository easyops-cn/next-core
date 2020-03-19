import inquirer from "inquirer";
import { TargetType } from "./interface";
import { askTargetType } from "./questions/askTargetType";
import { askPackageName } from "./questions/askPackageName";
import { askBrickName } from "./questions/askBrickName";
import { askTemplateName } from "./questions/askTemplateName";
import { ask } from "./ask";

jest.mock("inquirer");
jest.mock("./questions/askTargetType");
jest.mock("./questions/askPackageName");
jest.mock("./questions/askBrickName");
jest.mock("./questions/askTemplateName");

jest.spyOn(inquirer, "prompt").mockImplementation((v: any) => v);
const spyOnAskTargetType = askTargetType as jest.Mock;
const spyOnAskPackageName = askPackageName as jest.Mock;
const spyOnAskBrickName = askBrickName as jest.Mock;
const spyOnAskTemplateName = askTemplateName as jest.Mock;

describe("ask", () => {
  test.each<[TargetType, string, string, string]>([
    [TargetType.A_NEW_BRICK, "package-a", "brick-a", ""],
    [TargetType.A_NEW_CUSTOM_PROVIDER_BRICK, "package-a", "brick-b", ""],
    [TargetType.A_NEW_PACKAGE_OF_LIBS, "lib-a", "", ""],
    [TargetType.A_NEW_LEGACY_TEMPLATE, "package-b", "", "template-b"]
  ])(
    "should return { targetType: '%s', packageName: '%s', brickName: '%s', templateName: '%s' }",
    async (targetType, packageName, brickName, templateName) => {
      spyOnAskTargetType.mockReturnValue({ targetType });
      spyOnAskPackageName.mockReturnValue({ packageName });
      spyOnAskBrickName.mockReturnValue({ brickName });
      spyOnAskTemplateName.mockReturnValue({ templateName });

      expect(await ask("")).toEqual({
        targetType,
        packageName,
        brickName,
        templateName
      });

      spyOnAskTargetType.mockReset();
      spyOnAskPackageName.mockReset();
      spyOnAskBrickName.mockReset();
      spyOnAskTemplateName.mockReset();
    }
  );
});
