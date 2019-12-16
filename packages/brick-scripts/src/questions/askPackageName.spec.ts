import fs from "fs";
import { askPackageName } from "./askPackageName";
import { TargetType } from "../interface";

jest.mock("fs");

jest.spyOn(fs, "readdirSync").mockImplementation(
  () =>
    [
      {
        isDirectory: () => true,
        name: "fake-package-sdk"
      }
    ] as any
);
jest.spyOn(fs, "existsSync").mockReturnValue(false);

describe("askPackageName", () => {
  it("should validate correctly for new package of bricks", () => {
    const { validate } = askPackageName({
      targetType: TargetType.A_NEW_PACKAGE_OF_BRICKS,
      appRoot: process.cwd()
    }) as any;
    expect(validate("good")).toBe(true);
    expect(validate("Bad")).not.toBe(true);
    expect(validate("providers-of-any")).not.toBe(true);
  });
  it("should validate correctly for new package of libs", () => {
    const { validate } = askPackageName({
      targetType: TargetType.A_NEW_PACKAGE_OF_LIBS,
      appRoot: process.cwd()
    }) as any;
    expect(validate("good")).toBe(true);
  });
  it("should return choices of package for new brick", () => {
    const { choices } = askPackageName({
      targetType: TargetType.A_NEW_BRICK,
      appRoot: process.cwd()
    }) as any;
    expect(choices).toEqual(["fake-package-sdk"]);
  });
  it("should return choices of package for new custom provider brick", () => {
    const { choices } = askPackageName({
      targetType: TargetType.A_NEW_CUSTOM_PROVIDER_BRICK,
      appRoot: process.cwd()
    }) as any;
    expect(choices).toEqual(["fake-package-sdk"]);
  });
  it("should return choices of package for new providers", () => {
    const { choices } = askPackageName({
      targetType: TargetType.A_NEW_PACKAGE_OF_PROVIDERS,
      appRoot: process.cwd()
    }) as any;
    expect(choices).toEqual([
      {
        name: "fake-package-sdk",
        value: "providers-of-fake-package"
      }
    ]);
  });
  it("should validate correctly for new package of templates", () => {
    const { validate } = askPackageName({
      targetType: TargetType.A_NEW_PACKAGE_OF_TEMPLATES,
      appRoot: process.cwd()
    }) as any;
    expect(validate("good")).toBe(true);
    expect(validate("Bad")).not.toBe(true);
  });
  it("should return choices of package for new template", () => {
    const { choices } = askPackageName({
      targetType: TargetType.A_NEW_TEMPLATE,
      appRoot: process.cwd()
    }) as any;
    expect(choices).toEqual(["fake-package-sdk"]);
  });
  it("should return choices of micro-app package for transform", () => {
    const { choices } = askPackageName({
      targetType: TargetType.TRANSFORM_A_MICRO_APP,
      appRoot: process.cwd()
    }) as any;
    expect(choices).toEqual(["fake-package-sdk"]);
  });
  it("should return choices of template package for patch", () => {
    const { choices } = askPackageName({
      targetType: TargetType.I18N_PATCH_A_PACKAGE_OF_TEMPLATES,
      appRoot: process.cwd()
    }) as any;
    expect(choices).toEqual(["fake-package-sdk"]);
  });
});
