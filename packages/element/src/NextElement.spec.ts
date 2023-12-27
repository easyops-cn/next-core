import { describe, test, jest, expect } from "@jest/globals";
import { NextElement } from "./NextElement.js";
import { createDecorators } from "./createDecorators.js";
import { EventEmitter } from "./interfaces.js";

const waitForAnimationFrame = () =>
  new Promise((resolve) => requestAnimationFrame(resolve));

describe("NextElement", () => {
  test("string property", async () => {
    const { defineElement, property } = createDecorators();
    const render = jest.fn();
    @defineElement("my-element-str")
    class MyElement extends NextElement {
      @property() accessor stringAttr: string | undefined;

      _render() {
        render(this.stringAttr);
      }
    }

    const element = document.createElement("my-element-str") as MyElement;
    expect(render).toBeCalledTimes(0);
    document.body.appendChild(element);
    expect(render).toHaveBeenNthCalledWith(1, undefined);
    expect(element.getAttribute("string-attr")).toBe(null);

    element.stringAttr = "hi";
    expect(element.getAttribute("string-attr")).toBe("hi");
    expect(render).toBeCalledTimes(1);
    await (global as any).flushPromises();
    expect(render).toHaveBeenNthCalledWith(2, "hi");

    element.setAttribute("string-attr", "Hi");
    expect(render).toBeCalledTimes(2);
    await (global as any).flushPromises();
    expect(render).toHaveBeenNthCalledWith(3, "Hi");

    element.setAttribute("string-attr", "Hi");
    expect(render).toBeCalledTimes(3);
    await (global as any).flushPromises();
    expect(render).toBeCalledTimes(3);
  });

  test("string property with default value", async () => {
    const { defineElement, property } = createDecorators();
    const render = jest.fn();
    @defineElement("my-element-str-2")
    class MyElement extends NextElement {
      @property() accessor stringAttr = "initial";

      _render() {
        render(this.stringAttr);
      }
    }

    const element = document.createElement("my-element-str-2") as MyElement;
    expect(render).toBeCalledTimes(0);
    document.body.appendChild(element);
    expect(render).toHaveBeenNthCalledWith(1, "initial");

    // The default prop has not been reflected to the attribute yet.
    expect(element.getAttribute("string-attr")).toBe(null);

    element.stringAttr = "updated";
    expect(element.getAttribute("string-attr")).toBe("updated");
    expect(render).toBeCalledTimes(1);
    await (global as any).flushPromises();
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
      @property({ type: Boolean }) accessor booleanAttr: boolean | undefined;

      _render() {
        render(this.booleanAttr);
      }
    }

    const element = document.createElement("my-element-bool") as MyElement;
    expect(render).toBeCalledTimes(0);
    document.body.appendChild(element);
    expect(render).toHaveBeenNthCalledWith(1, undefined);
    expect(element.getAttribute("boolean-attr")).toBe(null);

    element.booleanAttr = true;
    expect(element.getAttribute("boolean-attr")).toBe("");
    expect(render).toBeCalledTimes(1);
    await (global as any).flushPromises();
    expect(render).toHaveBeenNthCalledWith(2, true);

    element.booleanAttr = false;
    expect(element.getAttribute("boolean-attr")).toBe(null);
    expect(render).toBeCalledTimes(2);
    await (global as any).flushPromises();
    expect(render).toHaveBeenNthCalledWith(3, false);

    element.booleanAttr = undefined;
    expect(element.getAttribute("boolean-attr")).toBe(null);
    expect(render).toBeCalledTimes(3);
    await (global as any).flushPromises();
    expect(render).toHaveBeenNthCalledWith(4, false);

    (element as any).booleanAttr = 0;
    expect(element.getAttribute("boolean-attr")).toBe(null);
    expect(render).toBeCalledTimes(4);
    await (global as any).flushPromises();
    expect(render).toHaveBeenNthCalledWith(5, false);
  });

  test("boolean property with default true", async () => {
    const { defineElement, property } = createDecorators();
    const render = jest.fn();
    @defineElement("my-element-bool-true")
    class MyElement extends NextElement {
      @property({ type: Boolean }) accessor booleanAttr = true;

      _render() {
        render(this.booleanAttr);
      }
    }

    const container = document.createElement("div");
    container.innerHTML = "<my-element-bool-true></my-element-bool-true>";
    expect(render).toBeCalledTimes(0);
    expect((container.firstElementChild as MyElement).booleanAttr).toBe(true);

    document.body.appendChild(container);
    expect(render).toBeCalledTimes(1);
    expect(render).toHaveBeenNthCalledWith(1, true);
    await (global as any).flushPromises();
    expect(render).toBeCalledTimes(1);
  });

  test("boolean property with default true but reset to false", async () => {
    const { defineElement, property } = createDecorators();
    const render = jest.fn();
    @defineElement("my-element-bool-true-to-false")
    class MyElement extends NextElement {
      @property({ type: Boolean }) accessor booleanAttr = true;

      _render() {
        render(this.booleanAttr);
      }
    }

    const container = document.createElement("div");
    container.innerHTML =
      '<my-element-bool-true-to-false boolean-attr="false"></my-element-bool-true-to-false>';
    expect(render).toBeCalledTimes(0);
    expect((container.firstElementChild as MyElement).booleanAttr).toBe(false);

    document.body.appendChild(container);
    expect(render).toBeCalledTimes(1);
    expect(render).toHaveBeenNthCalledWith(1, false);
    await (global as any).flushPromises();
    expect(render).toBeCalledTimes(1);
  });

  test("number property", async () => {
    const { defineElement, property } = createDecorators();
    const render = jest.fn();
    @defineElement("my-element-num")
    class MyElement extends NextElement {
      @property({ type: Number }) accessor numberAttr: number | undefined;

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

    (element as any).numberAttr = "7";
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

  test("complex property", async () => {
    const { defineElement, property } = createDecorators();
    const render = jest.fn();
    @defineElement("my-element-obj")
    class MyElement extends NextElement {
      @property({ attribute: false }) accessor complexAttr: unknown;

      _render() {
        render(this.complexAttr);
      }
    }

    const element = document.createElement("my-element-obj") as MyElement;
    expect(render).toBeCalledTimes(0);
    document.body.appendChild(element);
    expect(render).toBeCalledTimes(1);
    expect(render).toHaveBeenNthCalledWith(1, undefined);
    expect(element.getAttribute("string-attr")).toBe(null);

    element.complexAttr = { quality: "good" };
    expect(element.getAttribute("complex-attr")).toBe(null);
    expect(render).toBeCalledTimes(1);
    await (global as any).flushPromises();
    expect(render).toBeCalledTimes(2);
    expect(render).toHaveBeenNthCalledWith(2, { quality: "good" });
  });

  test("Inheritance", async () => {
    const { defineElement: defineBaseElement, property: baseProperty } =
      createDecorators();
    const baseRender = jest.fn();
    @defineBaseElement("my-base-element")
    class MyBaseElement extends NextElement {
      @baseProperty() accessor baseAttr: string | undefined;
      @baseProperty() accessor baseFinalAttr: string | undefined;

      _render() {
        baseRender({
          baseAttr: this.baseAttr,
          baseFinalAttr: this.baseFinalAttr,
        });
      }
    }

    const { defineElement: superDefineElement, property: superProperty } =
      createDecorators();
    const superRender = jest.fn();
    @superDefineElement("my-super-element")
    class MySuperElement extends MyBaseElement {
      @superProperty() accessor baseAttr = "overridden";
      @superProperty() accessor superAttr: string | undefined;

      _render() {
        superRender({
          baseAttr: this.baseAttr,
          baseFinalAttr: this.baseFinalAttr,
          superAttr: this.superAttr,
        });
      }
    }

    const baseElement = document.createElement(
      "my-base-element"
    ) as MyBaseElement;
    const superElement = document.createElement(
      "my-super-element"
    ) as MySuperElement;
    expect(
      (baseElement.constructor as any)._dev_only_definedProperties
    ).toEqual(["baseAttr", "baseFinalAttr"]);
    expect(
      (superElement.constructor as any)._dev_only_definedProperties
    ).toEqual(["baseAttr", "baseFinalAttr", "superAttr"]);

    expect(baseElement.baseAttr).toBe(undefined);
    expect(superElement.baseAttr).toBe("overridden");

    document.body.appendChild(baseElement);
    expect(baseRender).toBeCalledTimes(1);
    expect(baseRender).toHaveBeenNthCalledWith(1, {
      baseAttr: undefined,
      baseFinalAttr: undefined,
    });

    document.body.appendChild(superElement);
    expect(superRender).toBeCalledTimes(1);
    expect(superRender).toHaveBeenNthCalledWith(1, {
      baseAttr: "overridden",
      baseFinalAttr: undefined,
      superAttr: undefined,
    });

    baseElement.baseAttr = "updated";
    expect(baseElement.baseAttr).toBe("updated");
    expect(superElement.baseAttr).toBe("overridden");
    expect(baseRender).toBeCalledTimes(1);
    await (global as any).flushPromises();
    expect(baseRender).toHaveBeenNthCalledWith(2, {
      baseAttr: "updated",
      baseFinalAttr: undefined,
    });

    superElement.baseAttr = "updated-again";
    expect(baseElement.baseAttr).toBe("updated");
    expect(superElement.baseAttr).toBe("updated-again");
    expect(superRender).toBeCalledTimes(1);
    await (global as any).flushPromises();
    expect(superRender).toHaveBeenNthCalledWith(2, {
      baseAttr: "updated-again",
      baseFinalAttr: undefined,
      superAttr: undefined,
    });
  });

  test("Render as parsed DOM", async () => {
    const { defineElement, property } = createDecorators();
    const render = jest.fn();
    @defineElement("my-element-parsed")
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    class MyElement extends NextElement {
      @property() accessor stringAttr: string | undefined;
      @property({ type: Boolean }) accessor booleanAttr: boolean | undefined;
      @property({ type: Number }) accessor numberAttr: number | undefined;

      _render() {
        render({
          stringAttr: this.stringAttr,
          booleanAttr: this.booleanAttr,
          numberAttr: this.numberAttr,
        });
      }
    }

    const container = document.createElement("div");
    container.innerHTML =
      '<my-element-parsed string-attr="Hi" boolean-attr number-attr="42"></my-element-parsed>';
    expect(render).toBeCalledTimes(0);

    document.body.appendChild(container);
    expect(render).toBeCalledTimes(1);
    expect(render).toHaveBeenNthCalledWith(1, {
      stringAttr: "Hi",
      booleanAttr: true,
      numberAttr: 42,
    });
    await (global as any).flushPromises();
    expect(render).toBeCalledTimes(1);
  });

  test("methods and events", () => {
    const { defineElement, property, method, event } = createDecorators();
    @defineElement("my-element-event")
    class MyElement extends NextElement {
      @property() accessor stringAttr: string | undefined;
      @event({ type: "change" }) accessor #_changeEvent!: EventEmitter<string>;

      @method()
      triggerChange(value: string) {
        this.#_changeEvent.emit(value);
      }

      overrideEvent() {
        this.#_changeEvent = null!;
      }

      _render() {
        // Do nothing
      }
    }

    const element = document.createElement("my-element-event") as MyElement;
    expect((element.constructor as any)._dev_only_definedMethods).toEqual([
      "triggerChange",
    ]);
    expect((element.constructor as any)._dev_only_definedEvents).toEqual([
      "change",
    ]);

    // `expect(...).toThrowError()` does not work for decorators.
    let message: string | undefined;
    try {
      element.overrideEvent();
    } catch (e) {
      message = (e as Error).message;
    }
    expect(message).toBe("Decorated events are readonly");

    const listener = jest.fn();
    element.addEventListener("change", listener);
    element.triggerChange("updated");
    expect(listener).toBeCalledTimes(1);
    expect(listener).toBeCalledWith(
      expect.objectContaining({
        type: "change",
        detail: "updated",
      })
    );
  });

  test("methods bound", () => {
    const { defineElement, property, method } = createDecorators();
    @defineElement("my-element-bound-methods")
    class MyElement extends NextElement {
      @property() accessor value: string | undefined;

      @method({ bound: true })
      getBoundValue() {
        return this.value;
      }

      @method()
      getUnboundValue() {
        return this.value;
      }

      _render() {
        // Do nothing
      }
    }

    const element = document.createElement(
      "my-element-bound-methods"
    ) as MyElement;
    element.value = "good";
    expect(element.getBoundValue()).toEqual("good");
    expect(element.getUnboundValue()).toEqual("good");

    const newTarget = {
      value: "bad",
    };
    expect(element.getBoundValue.call(newTarget)).toEqual("good");
    expect(element.getUnboundValue.call(newTarget)).toEqual("bad");
  });

  test("alias", () => {
    const { defineElement, property } = createDecorators();
    @defineElement("my-element-alias", {
      alias: ["my-element-alias-2"],
      shadowOptions: false,
    })
    class MyElement extends NextElement {
      @property() accessor value: string | undefined;

      _render() {
        // Do nothing
      }
    }

    const element = document.createElement("my-element-alias") as MyElement;
    expect((element.constructor as any).__tagName).toEqual("my-element-alias");
    expect((element.constructor as any).__tagName).toEqual("my-element-alias");
    expect((element.constructor as any)._dev_only_definedProperties).toEqual([
      "value",
    ]);

    const element2 = document.createElement("my-element-alias-2") as MyElement;
    expect((element2.constructor as any).__tagName).toEqual(
      "my-element-alias-2"
    );
    expect((element2.constructor as any)._dev_only_definedProperties).toEqual([
      "value",
    ]);
  });

  test("specific attribute", async () => {
    const { defineElement, property } = createDecorators();
    const render = jest.fn();
    @defineElement("my-element-specific-attr", {
      shadowOptions: false,
    })
    class MyElement extends NextElement {
      @property({ attribute: "val", type: Number }) accessor value:
        | number
        | undefined;

      _render() {
        render();
        return String(this.value);
      }
    }

    const element = document.createElement(
      "my-element-specific-attr"
    ) as MyElement;
    element.value = 12;
    expect(element.getAttribute("val")).toBe("12");

    document.body.appendChild(element);
    await (global as any).flushPromises();
    expect(render).toBeCalledTimes(1);

    element.setAttribute("val", "NaN");
    expect(element.value).toBe(NaN);
    await (global as any).flushPromises();
    expect(render).toBeCalledTimes(2);

    element.value = NaN;
    expect(element.value).toBe(NaN);
    await (global as any).flushPromises();
    expect(render).toBeCalledTimes(2);

    element.remove();
  });

  test("boolean property defaults to true", async () => {
    const { defineElement, property } = createDecorators();
    @defineElement("my-element-prop-default-true", {
      shadowOptions: false,
    })
    class MyElement extends NextElement {
      @property({ type: Boolean }) accessor booleanAttr = true;
      @property() accessor stringAttr: string | undefined;

      _render() {
        return String(this.booleanAttr);
      }
    }

    const element = document.createElement(
      "my-element-prop-default-true"
    ) as MyElement;
    element.booleanAttr = false;
    expect(element.getAttribute("boolean-attr")).toBe(null);

    document.body.appendChild(element);

    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(element.getAttribute("boolean-attr")).toBe(null);

    element.stringAttr = "update";
    expect(element.booleanAttr).toBe(false);
    expect(element.getAttribute("boolean-attr")).toBe(null);
  });

  test("property with render: false", async () => {
    const { defineElement, property } = createDecorators();
    const render = jest.fn();
    @defineElement("my-element-render-false")
    class MyElement extends NextElement {
      @property({ render: false }) accessor stringAttr: string | undefined;

      _render() {
        render(this.stringAttr);
      }
    }

    const element = document.createElement(
      "my-element-render-false"
    ) as MyElement;
    element.stringAttr = "hi";
    expect(render).toBeCalledTimes(0);
    document.body.appendChild(element);
    expect(render).toHaveBeenNthCalledWith(1, "hi");
    expect(element.getAttribute("string-attr")).toBe("hi");
    expect(render).toBeCalledTimes(1);

    element.stringAttr = "halo";
    await (global as any).flushPromises();
    expect(render).toBeCalledTimes(1);

    element.remove();
  });
});
