import fs from "fs";
import { askProcessorName } from "./askProcessorName";

jest
  .spyOn(fs, "existsSync")
  .mockImplementation((filePath: any) => filePath.includes("doExisted"));

describe("askProcessorName", () => {
  it("should validate correctly", () => {
    const { validate } = askProcessorName({
      packageName: "layout",
      appRoot: process.cwd(),
    }) as any;
    expect(validate("do-bad")).not.toBe(true);
    expect(validate("doExisted")).not.toBe(false);
    expect(validate("doGood")).toBe(true);
  });
});
