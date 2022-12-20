import { describe, test, jest, expect } from "@jest/globals";
import { NextElement } from "./NextElement";
import { createDecorators } from "./createDecorators";

const waitForAnimationFrame = () =>
  new Promise((resolve) => requestAnimationFrame(resolve));

describe("NextElement", () => {
  test("string property", async () => {
    const { defineElement, property } = createDecorators();
    const render = jest.fn();
    @defineElement("my-element-str")
    class MyElement extends NextElement {
      @property() accessor stringAttr;

      connectedCallback() {
        super.connectedCallback();
        this._render();
      }

      _render() {
        render(this.stringAttr);
      }
    }

    const element = document.createElement("my-element-str") as MyElement;
    expect(render).toBeCalledTimes(0);
    document.body.appendChild(element);
    expect(render).toBeCalledTimes(1);
    expect(render).toHaveBeenNthCalledWith(1, undefined);
    expect(element.getAttribute("string-attr")).toBe(null);

    element.stringAttr = "hi";
    expect(element.getAttribute("string-attr")).toBe("hi");
    expect(render).toBeCalledTimes(1);
    await (global as any).flushPromises();
    expect(render).toBeCalledTimes(2);
    expect(render).toHaveBeenNthCalledWith(2, "hi");
  });

  test("string property with default value", async () => {
    const { defineElement, property } = createDecorators();
    const render = jest.fn();
    @defineElement("my-element-str-2")
    class MyElement extends NextElement {
      @property() accessor stringAttr = "initial";

      connectedCallback() {
        super.connectedCallback();
        this._render();
      }

      _render() {
        render(this.stringAttr);
      }
    }

    const element = document.createElement("my-element-str-2") as MyElement;
    expect(render).toBeCalledTimes(0);
    document.body.appendChild(element);
    expect(render).toBeCalledTimes(1);
    expect(render).toHaveBeenNthCalledWith(1, "initial");

    // The default prop has not been reflected to the attribute yet.
    expect(element.getAttribute("string-attr")).toBe(null);

    element.stringAttr = "updated";
    expect(element.getAttribute("string-attr")).toBe("updated");
    expect(render).toBeCalledTimes(1);
    await (global as any).flushPromises();
    expect(render).toBeCalledTimes(2);
    expect(render).toHaveBeenNthCalledWith(2, "updated");

    expect(element.getAttribute("string-attr")).toBe("updated");
    await waitForAnimationFrame();
    // Ensure the default prop will not override an attribute that has already
    // been set manually.
    expect(element.getAttribute("string-attr")).toBe("updated");
  });

  test("string property with default value that will not change", async () => {
    const { defineElement, property } = createDecorators();
    const render = jest.fn();
    @defineElement("my-element-str-3")
    class MyElement extends NextElement {
      @property() accessor stringAttr = "initial";

      connectedCallback() {
        super.connectedCallback();
        this._render();
      }

      _render() {
        render(this.stringAttr);
      }
    }

    const element = document.createElement("my-element-str-3") as MyElement;

    // The default prop has not been reflected to the attribute yet.
    expect(element.getAttribute("string-attr")).toBe(null);
    await waitForAnimationFrame();
    // The default prop will be reflected to the attribute by an animation frame
    expect(element.getAttribute("string-attr")).toBe("initial");
  });

  test("boolean property", async () => {
    const { defineElement, property } = createDecorators();
    const render = jest.fn();
    @defineElement("my-element-bool")
    class MyElement extends NextElement {
      @property({ type: Boolean }) accessor booleanAttr;

      connectedCallback() {
        super.connectedCallback();
        this._render();
      }

      _render() {
        render(this.booleanAttr);
      }
    }

    const element = document.createElement("my-element-bool") as MyElement;
    expect(render).toBeCalledTimes(0);
    document.body.appendChild(element);
    expect(render).toBeCalledTimes(1);
    expect(render).toHaveBeenNthCalledWith(1, undefined);
    expect(element.getAttribute("boolean-attr")).toBe(null);

    element.booleanAttr = true;
    expect(element.getAttribute("boolean-attr")).toBe("");
    expect(render).toBeCalledTimes(1);
    await (global as any).flushPromises();
    expect(render).toBeCalledTimes(2);
    expect(render).toHaveBeenNthCalledWith(2, true);

    element.booleanAttr = false;
    expect(element.getAttribute("boolean-attr")).toBe(null);
    expect(render).toBeCalledTimes(2);
    await (global as any).flushPromises();
    expect(render).toBeCalledTimes(3);
    expect(render).toHaveBeenNthCalledWith(3, false);

    element.booleanAttr = undefined;
    expect(element.getAttribute("boolean-attr")).toBe(null);
    expect(render).toBeCalledTimes(3);
    await (global as any).flushPromises();
    expect(render).toBeCalledTimes(4);
    // expect(render).toHaveBeenNthCalledWith(4, undefined);
    expect(render).toHaveBeenNthCalledWith(4, false);

    element.booleanAttr = 0;
    expect(element.getAttribute("boolean-attr")).toBe(null);
    expect(render).toBeCalledTimes(4);
    await (global as any).flushPromises();
    expect(render).toBeCalledTimes(5);
    // expect(render).toHaveBeenNthCalledWith(5, 0);
    expect(render).toHaveBeenNthCalledWith(5, false);
  });

  test("number property", async () => {
    const { defineElement, property } = createDecorators();
    const render = jest.fn();
    @defineElement("my-element-num")
    class MyElement extends NextElement {
      @property({ type: Number }) accessor numberAttr;

      connectedCallback() {
        super.connectedCallback();
        this._render();
      }

      _render() {
        render(this.numberAttr);
      }
    }

    const element = document.createElement("my-element-num") as MyElement;
    expect(render).toBeCalledTimes(0);
    document.body.appendChild(element);
    expect(render).toBeCalledTimes(1);
    expect(render).toHaveBeenNthCalledWith(1, undefined);
    expect(element.getAttribute("number-attr")).toBe(null);

    element.numberAttr = 42;
    expect(element.getAttribute("number-attr")).toBe("42");
    expect(render).toBeCalledTimes(1);
    await (global as any).flushPromises();
    expect(render).toBeCalledTimes(2);
    expect(render).toHaveBeenNthCalledWith(2, 42);

    element.numberAttr = "7";
    expect(element.getAttribute("number-attr")).toBe("7");
    expect(render).toBeCalledTimes(2);
    await (global as any).flushPromises();
    expect(render).toBeCalledTimes(3);
    // expect(render).toHaveBeenNthCalledWith(3, "7");
    expect(render).toHaveBeenNthCalledWith(3, 7);

    element.numberAttr = undefined;
    expect(element.getAttribute("number-attr")).toBe(null);
    expect(render).toBeCalledTimes(3);
    await (global as any).flushPromises();
    expect(render).toBeCalledTimes(4);
    // expect(render).toHaveBeenNthCalledWith(4, undefined);
    expect(render).toHaveBeenNthCalledWith(4, null);
  });
});
