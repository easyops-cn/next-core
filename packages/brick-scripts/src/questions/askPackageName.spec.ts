import fs from "fs";
import { getEasyopsConfig } from "@next-core/repo-config";
import { askPackageName } from "./askPackageName";
import { TargetType } from "../interface";

jest.mock("@next-core/repo-config");
(getEasyopsConfig as jest.Mock).mockReturnValue({
  useLocalSdk: true,
});

jest.mock("fs");

jest.spyOn(fs, "readdirSync").mockImplementation(
  () =>
    [
      {
        isDirectory: () => true,
        name: "fake-package-sdk",
      },
    ] as any
);
jest.spyOn(fs, "existsSync").mockReturnValue(false);

describe("askPackageName", () => {
  it("should validate correctly for new package of bricks", () => {
    const { validate } = askPackageName({
      targetType: TargetType.A_NEW_PACKAGE_OF_BRICKS,
      appRoot: process.cwd(),
    }) as any;
    expect(validate("good")).toBe(true);
    expect(validate("Bad")).not.toBe(true);
    expect(validate("providers-of-any")).not.toBe(true);
  });

  it("should validate correctly for new package of libs", () => {
    const { validate } = askPackageName({
      targetType: TargetType.A_NEW_PACKAGE_OF_LIBS,
      appRoot: process.cwd(),
    }) as any;
    expect(validate("good")).toBe(true);
  });

  it("should return choices of package for new brick", async () => {
    const { source } = askPackageName({
      targetType: TargetType.A_NEW_BRICK,
      appRoot: process.cwd(),
    }) as any;
    expect(await source()).toEqual(["fake-package-sdk"]);
  });

  it("should return choices of package for new custom provider", async () => {
    const { source } = askPackageName({
      targetType: TargetType.A_NEW_CUSTOM_PROVIDER,
      appRoot: process.cwd(),
    }) as any;
    expect(await source()).toEqual(["fake-package-sdk"]);
  });

  it("should return choices of package for new providers", async () => {
    const { source } = askPackageName({
      targetType: TargetType.A_NEW_PACKAGE_OF_PROVIDERS,
      appRoot: process.cwd(),
    }) as any;
    expect(await source()).toEqual([
      {
        name: "fake-package-sdk",
        value: "providers-of-fake-package",
      },
    ]);
  });
});
