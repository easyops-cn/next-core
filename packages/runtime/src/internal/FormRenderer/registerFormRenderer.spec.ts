import { FORM_RENDERER } from "./constants.js";
import { registerFormRenderer } from "./registerFormRenderer.js";

describe("registerFormRenderer is work", () => {
  registerFormRenderer();
  it("should define a custom element", () => {
    const render = customElements.get(FORM_RENDERER) as any;
    expect(render.prototype.$$typeof).toBe("formRenderer");
  });

  it("should work with validate method", () => {
    const formRender = document.createElement(FORM_RENDERER) as any;
    formRender.renderRoot = false;
    const form = document.createElement("eo-form") as any;
    form.validate = jest.fn();

    formRender.appendChild(form);

    formRender.validate();

    expect(form.validate).toHaveBeenCalled();
  });

  it("should work with validate method and render in root", () => {
    const formRender = document.createElement(FORM_RENDERER) as any;

    const rootElement = document.createElement("div");

    formRender.appendChild(rootElement);

    const form = document.createElement("eo-form") as any;
    form.validate = jest.fn();

    rootElement.appendChild(form);

    formRender.validate();

    expect(form.validate).toHaveBeenCalled();
  });

  it("no validate method with other container", () => {
    const formRender = document.createElement(FORM_RENDERER) as any;
    formRender.renderRoot = false;
    const form = document.createElement("div") as any;

    formRender.appendChild(form);

    const mockConsoleError = jest.spyOn(console, "error");

    formRender.validate();

    expect(mockConsoleError).toHaveBeenCalledWith(
      "no validate method in the container element",
      {
        container: "div",
      }
    );
  });

  it("should work with setInitValue method", () => {
    const formRender = document.createElement(FORM_RENDERER) as any;
    formRender.renderRoot = false;
    const form = document.createElement("eo-form") as any;
    form.setInitValue = jest.fn();

    formRender.appendChild(form);

    formRender.setInitValue({ name: "easyops" }, { runInMacrotask: true });

    expect(form.setInitValue).toHaveBeenCalledWith(
      { name: "easyops" },
      { runInMacrotask: true }
    );
  });

  it("should work with resetFields method", () => {
    const formRender = document.createElement(FORM_RENDERER) as any;
    formRender.renderRoot = false;
    const form = document.createElement("forms.general-form") as any;
    form.resetFields = jest.fn();

    formRender.appendChild(form);

    formRender.resetFields();

    expect(form.resetFields).toHaveBeenCalled();
  });
});
