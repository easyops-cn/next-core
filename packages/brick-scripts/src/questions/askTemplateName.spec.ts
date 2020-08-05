import fs from "fs";
import { askTemplateName } from "./askTemplateName";
import { TargetType } from "../interface";

jest
  .spyOn(fs, "existsSync")
  .mockImplementation((filePath: any) => filePath.includes("for-existed"));

describe("askTemplateName", () => {
  it("should validate correctly", () => {
    const { validate } = askTemplateName({
      targetType: TargetType.A_NEW_PACKAGE_OF_LEGACY_TEMPLATES,
      packageName: "layout",
      appRoot: process.cwd(),
    }) as any;
    expect(validate("Bad")).not.toBe(true);
    expect(validate("for-existed")).not.toBe(true);
    expect(validate("for-good")).toBe(true);
  });
});
