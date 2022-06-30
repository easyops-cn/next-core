import { formRender } from "./constants";
import { registerFormRender } from "./registerFormRender";

describe("registerFormRender is work", () => {
  registerFormRender();
  it("should define a custom element", () => {
    const render = customElements.get(formRender);
    expect(render.prototype.$$typeof).toBe("formRender");
  });
});
