import { registerFormRender } from "./registerFormRender";

describe("registerFormRender is work", () => {
  registerFormRender();
  it("should define a custom element", () => {
    const formRender = customElements.get("form-builder.form-render");
    expect(formRender.prototype.$$typeof).toBe("formRender");
  });
});
