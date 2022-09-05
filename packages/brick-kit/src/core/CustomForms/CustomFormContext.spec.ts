import { RuntimeBrick } from "../BrickNode";
import { CustomFormContext, getCustomFormContext } from "./CustomFormContext";

describe("CustomTemplateContext", () => {
  it("should work", () => {
    const brick: RuntimeBrick = {};
    const context = new CustomFormContext(brick);

    expect(context.id).toBe("form-ctx-1");

    context.setVariables({
      quality: "good",
    });

    expect(context.getVariables()).toEqual({
      quality: "good",
    });

    expect(context.getBrick()).toBe(brick);

    expect(getCustomFormContext("tpl-ctx-1")).toBe(undefined);
  });
});
