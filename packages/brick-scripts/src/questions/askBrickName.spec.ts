import { askBrickName } from "./askBrickName";
import { TargetType } from "../interface";

describe("askBrickName", () => {
  it("should return package name as default brick name", () => {
    const { default: defaultFn } = askBrickName({
      targetType: TargetType.A_NEW_BRICK,
      packageName: "for-good",
      appRoot: "dist"
    }) as any;
    expect(defaultFn()).toBe("for-good");
  });

  it("should return package name as default brick name", () => {
    const { default: defaultFn } = askBrickName({
      targetType: TargetType.A_NEW_PACKAGE_OF_BRICKS,
      packageName: "for-good",
      appRoot: "dist"
    }) as any;
    expect(defaultFn()).toBe("for-good");
  });

  it("should append `-index` to default", () => {
    const { default: defaultFn } = askBrickName({
      targetType: TargetType.A_NEW_PACKAGE_OF_BRICKS,
      packageName: "good",
      appRoot: "dist"
    }) as any;
    expect(defaultFn()).toBe("good-index");
  });

  it("should validate correctly", () => {
    const { validate } = askBrickName({
      targetType: TargetType.A_NEW_PACKAGE_OF_BRICKS,
      packageName: "general-auth",
      appRoot: process.cwd()
    }) as any;
    expect(validate("bad")).not.toBe(true);
    expect(validate("for-good")).toBe(true);
  });
});
