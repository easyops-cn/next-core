import { CustomFormContext, getCustomFormContext } from "./CustomFormContext";

describe("CustomFormContext", () => {
  it("should work", () => {
    const context = new CustomFormContext();

    expect(context.id).toBe("form-ctx-1");
    expect(getCustomFormContext("tpl-ctx-1")).toBe(undefined);
  });
});
