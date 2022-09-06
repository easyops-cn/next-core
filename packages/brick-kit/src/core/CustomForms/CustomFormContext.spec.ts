import { RuntimeBrick } from "../BrickNode";
import { CustomFormContext, getCustomFormContext } from "./CustomFormContext";

describe("CustomFormContext", () => {
  it("should work", () => {
    const brick: RuntimeBrick = {};
    const context = new CustomFormContext(brick);

    expect(context.id).toBe("form-ctx-1");
    expect(getCustomFormContext("tpl-ctx-1")).toBe(undefined);
  });
});
