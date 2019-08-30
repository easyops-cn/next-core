import inquirer from "inquirer";
import { TargetType } from "./interface";
import { askTargetType } from "./questions/askTargetType";
import { askPackageName } from "./questions/askPackageName";
import { askBrickName } from "./questions/askBrickName";
import { ask } from "./ask";

jest.mock("inquirer");
jest.mock("./questions/askTargetType");
jest.mock("./questions/askPackageName");
jest.mock("./questions/askBrickName");

jest.spyOn(inquirer, "prompt").mockImplementation((v: any) => v);
const spyOnAskTargetType = askTargetType as jest.Mock;
const spyOnAskPackageName = askPackageName as jest.Mock;
const spyOnAskBrickName = askBrickName as jest.Mock;

describe("ask", () => {
  test.each<[TargetType, string, string]>([
    [TargetType.A_NEW_BRICK, "package-a", "brick-a"],
    [TargetType.A_NEW_PACKAGE_OF_LIBS, "lib-a", ""]
  ])(
    "should return { targetType: '%s', packageName: '%s', brickName: '%s' }",
    async (targetType, packageName, brickName) => {
      spyOnAskTargetType.mockReturnValueOnce({ targetType });
      spyOnAskPackageName.mockReturnValueOnce({ packageName });
      spyOnAskBrickName.mockReturnValueOnce({ brickName });
      expect(await ask("")).toEqual({
        targetType,
        packageName,
        brickName
      });
    }
  );
});
