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
  it("createProperty should work", async () => {
    const render = jest.fn();
    class TestElement extends UpdatingElement {
      protected _render = render;
    }

    TestElement.createProperty("stringAttr");
    // Overwrite will be ignored.
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

    class NoopElement extends UpdatingElement {}
    class ChildOfNoopElement extends NoopElement {}

    (ChildOfNoopElement as any).createProperty("operateAttr");

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
    expect((NoopElement as any)._dev_only_definedProperties).toEqual([]);
    expect((ChildOfNoopElement as any)._dev_only_definedProperties).toEqual([
      "operateAttr",
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

  it("createMethod should work", () => {
    class TestElement extends UpdatingElement {}
    class ChildTestElement extends TestElement {}

    class NoopElement extends UpdatingElement {}
    class ChildOfNoopElement extends NoopElement {}

    TestElement.createMethod("submit");
    (ChildTestElement as any).createMethod("validate");

    (ChildOfNoopElement as any).createMethod("operate");

    expect(UpdatingElement._dev_only_definedMethods).toEqual([]);
    expect(TestElement._dev_only_definedMethods).toEqual(["submit"]);
    expect((ChildTestElement as any)._dev_only_definedMethods).toEqual([
      "submit",
      "validate",
    ]);

    expect((NoopElement as any)._dev_only_definedMethods).toEqual([]);
    expect((ChildOfNoopElement as any)._dev_only_definedMethods).toEqual([
      "operate",
    ]);
  });

  it("createEventEmitter should work", () => {
    class TestElement extends UpdatingElement {}
    class ChildTestElement extends TestElement {}

    class NoopElement extends UpdatingElement {}
    class ChildOfNoopElement extends NoopElement {}

    TestElement.createEventEmitter("submitEmitter", {
      type: "test.submit",
    });
    TestElement.createEventEmitter("submitEmitter", {
      type: "overwrite.will.be.ignored",
    });
    (ChildTestElement as any).createEventEmitter("validateEmitter", {
      type: "test.validate",
    });

    (ChildOfNoopElement as any).createEventEmitter("operateEmitter", {
      type: "test.operate",
    });

    expect(UpdatingElement._dev_only_definedEvents).toEqual([]);
    expect(TestElement._dev_only_definedEvents).toEqual(["test.submit"]);
    expect((ChildTestElement as any)._dev_only_definedEvents).toEqual([
      "test.submit",
      "test.validate",
    ]);
    expect((NoopElement as any)._dev_only_definedEvents).toEqual([]);
    expect((ChildOfNoopElement as any)._dev_only_definedEvents).toEqual([
      "test.operate",
    ]);

    const element = new TestElement() as any;
    const childElement = new ChildTestElement() as any;
    const elementDispatch = (element.dispatchEvent = jest.fn());
    const childElementDispatch = (childElement.dispatchEvent = jest.fn());

    element.submitEmitter.emit({ quality: "good" });
    childElement.submitEmitter.emit({ quality: "better" });
    childElement.validateEmitter.emit({ quality: "perfect" });

    expect(elementDispatch).toBeCalledTimes(1);
    expect(elementDispatch.mock.calls[0][0].type).toBe("test.submit");
    expect(elementDispatch.mock.calls[0][0].detail).toEqual({
      quality: "good",
    });

    expect(childElementDispatch).toBeCalledTimes(2);
    expect(childElementDispatch.mock.calls[0][0].type).toBe("test.submit");
    expect(childElementDispatch.mock.calls[0][0].detail).toEqual({
      quality: "better",
    });
    expect(childElementDispatch.mock.calls[1][0].type).toBe("test.validate");
    expect(childElementDispatch.mock.calls[1][0].detail).toEqual({
      quality: "perfect",
    });

    // Event emitters should be readonly.
    expect(() => {
      element.submitEmitter = "bad";
    }).toThrow();

    expect(() => {
      element.submitEmitter.emit = "bad";
    }).toThrow();

    expect(() => {
      element.submitEmitter.newAttr = "bad";
    }).toThrow();

    expect(() => {
      element.validateEmitter = "good";
    }).not.toThrow();

    expect(() => {
      childElement.submitEmitter = "bad";
    }).toThrow();

    expect(() => {
      childElement.validateEmitter = "bad";
    }).toThrow();
  });
});
