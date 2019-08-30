import i18next from "i18next";
const spyOnAddResourceBundle = (i18next.addResourceBundle = jest.fn());

const spyOnDefine = jest.fn();
(window as any).customElements = {
  define: spyOnDefine
};

// Use `require` instead of `import` to avoid hoisting.
require("./index");

describe("index", () => {
  it("should add i18n resource bundle", () => {
    expect(spyOnAddResourceBundle).toBeCalled();
  });
  it("should define custom elements", () => {
    expect(spyOnDefine).toBeCalled();
  });
});
