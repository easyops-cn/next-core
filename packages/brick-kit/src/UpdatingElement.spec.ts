(global as any).HTMLElement = class FakeElement {
  private attrs: Record<string, string> = {};

  hasAttribute(name: string): boolean {
    return Object.prototype.hasOwnProperty.call(this.attrs, name);
  }

  getAttribute(name: string): string {
    return this.attrs[name] || null;
  }

  setAttribute(name: string, value: string): void {
    const old = this.attrs[name] || null;
    this.attrs[name] = value;
    this.attributeChangedCallback(name, old, value);
  }

  removeAttribute(name: string): void {
    const old = this.attrs[name];
    delete this.attrs[name];
    this.attributeChangedCallback(name, old, null);
  }

  attributeChangedCallback(name: string, old: string, value: string): void {
    // to be overload
  }
};

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { UpdatingElement } = require("./UpdatingElement");

describe("UpdatingElement", () => {
  it("should work", async () => {
    const render = jest.fn();
    class TestElement extends UpdatingElement {
      protected _render = render;
    }

    TestElement.createProperty("stringAttr");
    TestElement.createProperty("numberAttr", {
      type: Number,
    });
    TestElement.createProperty("booleanAttr", {
      type: Boolean,
      attribute: "bool-attr",
    });
    TestElement.createProperty("complexAttr", {
      attribute: false,
    });

    class ChildTestElement extends TestElement {}
    (ChildTestElement as any).createProperty("childAttr");

    expect(UpdatingElement.observedAttributes).toEqual([]);
    expect(TestElement.observedAttributes).toEqual([
      "string-attr",
      "number-attr",
      "bool-attr",
    ]);
    expect((ChildTestElement as any).observedAttributes).toEqual([
      "string-attr",
      "number-attr",
      "bool-attr",
      "child-attr",
    ]);

    expect(UpdatingElement._dev_only_definedProperties).toEqual([]);
    expect(TestElement._dev_only_definedProperties).toEqual([
      "stringAttr",
      "numberAttr",
      "booleanAttr",
      "complexAttr",
    ]);
    expect((ChildTestElement as any)._dev_only_definedProperties).toEqual([
      "stringAttr",
      "numberAttr",
      "booleanAttr",
      "complexAttr",
      "childAttr",
    ]);

    const element = new TestElement() as any;
    expect(element.$$typeof).toBe("brick");
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

    element.complexAttr = { hello: "world" };
    expect(element.complexAttr).toEqual({ hello: "world" });

    // Never trigger rendering if element is not connected.
    await (global as any).flushPromises();
    expect(render).not.toBeCalled();

    element.isConnected = true;
    element.stringAttr = "good";
    element.numberAttr = 3;
    element.booleanAttr = true;
    element.complexAttr = { hello: "again" };
    // Multiple property settings will trigger rendering only once
    // in the next event loop.
    expect(render).not.toBeCalled();
    await (global as any).flushPromises();
    expect(render).toBeCalledTimes(1);
  });
});
