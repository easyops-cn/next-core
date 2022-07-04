import { formRenderer } from "./constants";
import { registerFormRenderer } from "./registerFormRenderer";

describe("registerFormRenderer is work", () => {
  registerFormRenderer();
  it("should define a custom element", () => {
    const render = customElements.get(formRenderer);
    expect(render.prototype.$$typeof).toBe("formRenderer");
  });
});
