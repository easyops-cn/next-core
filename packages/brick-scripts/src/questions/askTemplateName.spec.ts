import { askTemplateName } from "./askTemplateName";
import { TargetType } from "../interface";

describe("askTemplateName", () => {
  it("should validate correctly", () => {
    const { validate } = askTemplateName({
      targetType: TargetType.A_NEW_PACKAGE_OF_BRICKS,
      packageName: "layout",
      appRoot: process.cwd()
    }) as any;
    expect(validate("Bad")).not.toBe(true);
    expect(validate("for-good")).toBe(true);
  });
});
