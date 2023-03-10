import { registerWidgetFunctions, widgetFunctions } from "./WidgetFunctions.js";

describe("widgetFunctions", () => {
  it("should work", () => {
    registerWidgetFunctions("widget-a", [
      {
        name: "abc",
        source: "function abc() { return 1 }",
      },
      {
        name: "xyz",
        source: "function xyz(): number { return 2 }",
        typescript: true,
      },
    ]);
    registerWidgetFunctions("widget-b", [
      {
        name: "abc",
        source: "function abc() { return 3 }",
      },
    ]);
    expect(widgetFunctions["widget-a"].abc()).toBe(1);
    expect(widgetFunctions["widget-a"].xyz()).toBe(2);
    expect(widgetFunctions["widget-b"].abc()).toBe(3);
    expect(() => {
      widgetFunctions["widget-b"].xyz();
    }).toThrowErrorMatchingInlineSnapshot(
      `"_WidgetFunctions.widgetFunctions.widget-b.xyz is not a function"`
    );
    expect(() => {
      registerWidgetFunctions("widget-a", [
        {
          name: "abc",
          source: "function abc() { return 1 }",
        },
      ]);
    }).toThrowErrorMatchingInlineSnapshot(
      `"Widget functions of \\"widget-a\\" already registered"`
    );
  });
});
