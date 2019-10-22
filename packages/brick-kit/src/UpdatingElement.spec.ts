(global as any).HTMLElement = class FakeElement {
  private attrs: Record<string, string> = {};

  hasAttribute(name: string): boolean {
    return Object.prototype.hasOwnProperty.call(this.attrs, name);
  }

  getAttribute(name: string): string {
    return this.attrs[name] || null;
  }

  setAttribute(name: string, value: string): void {
    this.attrs[name] = value;
  }

  removeAttribute(name: string): void {
    delete this.attrs[name];
  }
};

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { UpdatingElement } = require("./UpdatingElement");

describe("UpdatingElement", () => {
  it("should work", () => {
    class TestElement extends UpdatingElement {}

    TestElement.createProperty("stringAttr");
    TestElement.createProperty("numberAttr", {
      type: Number
    });
    TestElement.createProperty("booleanAttr", {
      type: Boolean,
      attribute: "bool-attr"
    });

    expect(TestElement.observedAttributes).toEqual([
      "string-attr",
      "number-attr",
      "bool-attr"
    ]);

    const element = new TestElement() as any;
    expect(element.stringAttr).toBe(null);
    expect(element.numberAttr).toBe(null);
    expect(element.booleanAttr).toBe(false);

    element.booleanAttr = false;
    element.booleanAttr = undefined;
    expect(element.booleanAttr).toBe(false);

    element.stringAttr = "hello";
    expect(element.getAttribute("string-attr")).toEqual("hello");
    element.setAttribute("string-attr", "world");
    expect(element.stringAttr).toEqual("world");

    element.numberAttr = 2;
    expect(element.getAttribute("number-attr")).toEqual(2);
    element.setAttribute("number-attr", "2");
    expect(element.numberAttr).toEqual(2);

    element.booleanAttr = true;
    expect(element.hasAttribute("bool-attr")).toBe(true);
    element.removeAttribute("bool-attr");
    expect(element.booleanAttr).toEqual(false);
  });
});
