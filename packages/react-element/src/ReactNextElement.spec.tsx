import React from "react";
import { describe, test, expect, jest } from "@jest/globals";
import { act } from "react-dom/test-utils";
import {
  createDecorators,
  supportsAdoptingStyleSheets,
} from "@next-core/element";
import { ReactNextElement } from "./ReactNextElement.js";

jest.mock("@next-core/element", () => {
  const originalModule = jest.requireActual("@next-core/element") as any;

  return {
    __esModule: true,
    ...originalModule,
    supportsAdoptingStyleSheets: jest.fn(),
  };
});

const mockSupportsAdoptingStyleSheets =
  supportsAdoptingStyleSheets as jest.Mock;

describe("ReactNextElement", () => {
  test("basic element", async () => {
    const { defineElement, property } = createDecorators();
    @defineElement("my-element")
    class MyElement extends ReactNextElement {
      @property() accessor stringAttr: string | undefined;

      render() {
        return <span>{this.stringAttr}</span>;
      }
    }
    const element = document.createElement("my-element") as MyElement;
    element.stringAttr = "Hi";

    expect(element.shadowRoot).toBeFalsy();
    act(() => {
      document.body.appendChild(element);
    });
    expect(element.shadowRoot?.innerHTML).toBe("<span>Hi</span>");

    element.stringAttr = "Hello";
    expect(element.shadowRoot?.innerHTML).toBe("<span>Hi</span>");
    await act(() => (global as any).flushPromises());
    expect(element.shadowRoot?.innerHTML).toBe("<span>Hello</span>");

    act(() => {
      document.body.removeChild(element);
    });
    expect(element.shadowRoot?.childNodes.length).toBe(0);

    // Re-connect
    act(() => {
      document.body.appendChild(element);
    });
    expect(element.shadowRoot?.innerHTML).toBe("<span>Hello</span>");
    act(() => {
      document.body.removeChild(element);
    });
    expect(element.shadowRoot?.childNodes.length).toBe(0);
  });

  test("basic element as parsed DOM", async () => {
    const { defineElement, property, method, event } = createDecorators();
    @defineElement("my-element-parsed")
    class MyElement extends ReactNextElement {
      @property() accessor stringAttr: string | undefined;

      render() {
        return <span>{this.stringAttr}</span>;
      }
    }
    const container = document.createElement("div");
    container.innerHTML =
      '<my-element-parsed string-attr="Hi"></my-element-parsed>';
    const element = container.firstElementChild as MyElement;

    expect(element.shadowRoot).toBeFalsy();
    act(() => {
      document.body.appendChild(element);
    });
    expect(element.shadowRoot?.innerHTML).toBe("<span>Hi</span>");

    element.setAttribute("string-attr", "Hello");
    expect(element.shadowRoot?.innerHTML).toBe("<span>Hi</span>");
    await act(() => (global as any).flushPromises());
    expect(element.shadowRoot?.innerHTML).toBe("<span>Hello</span>");

    act(() => {
      document.body.removeChild(element);
    });
    expect(element.shadowRoot?.childNodes.length).toBe(0);
  });

  test("basic element with style", async () => {
    const { defineElement, property } = createDecorators();
    @defineElement("my-element-with-style", {
      styleTexts: [":host{display:none}"],
    })
    class MyElement extends ReactNextElement {
      @property() accessor stringAttr: string | undefined;

      render() {
        return <span>{this.stringAttr}</span>;
      }
    }
    const element = document.createElement(
      "my-element-with-style"
    ) as MyElement;
    element.stringAttr = "Hi";
    act(() => {
      document.body.appendChild(element);
    });
    expect(element.shadowRoot?.innerHTML).toBe(
      "<style>:host{display:none}</style><span>Hi</span>"
    );

    element.stringAttr = "Hello";
    expect(element.shadowRoot?.innerHTML).toBe(
      "<style>:host{display:none}</style><span>Hi</span>"
    );
    await act(() => (global as any).flushPromises());
    expect(element.shadowRoot?.innerHTML).toBe(
      "<style>:host{display:none}</style><span>Hello</span>"
    );

    act(() => {
      document.body.removeChild(element);
    });
  });

  test("basic element with adopted style", async () => {
    mockSupportsAdoptingStyleSheets.mockReturnValue(true);
    const originalReplaceSync = CSSStyleSheet.prototype.replaceSync;
    if (!originalReplaceSync) {
      CSSStyleSheet.prototype.replaceSync = function (
        this: CSSStyleSheet,
        text: string
      ) {
        this.insertRule(text);
      };
    }

    const { defineElement, property } = createDecorators();
    @defineElement("my-element-with-adopted-style", {
      styleTexts: [":host{display:none}"],
    })
    class MyElement extends ReactNextElement {
      @property() accessor stringAttr: string | undefined;

      render() {
        return <span>{this.stringAttr}</span>;
      }
    }
    const element = document.createElement(
      "my-element-with-adopted-style"
    ) as MyElement;
    element.stringAttr = "Hi";
    expect(element.shadowRoot).toBeFalsy();
    act(() => {
      document.body.appendChild(element);
    });
    expect(element.shadowRoot?.innerHTML).toBe("<span>Hi</span>");
    expect(
      element.shadowRoot?.adoptedStyleSheets[0].cssRules[0].cssText
    ).toEqual(":host {display: none;}");

    element.stringAttr = "Hello";
    expect(element.shadowRoot?.innerHTML).toBe("<span>Hi</span>");
    await act(() => (global as any).flushPromises());
    expect(element.shadowRoot?.innerHTML).toBe("<span>Hello</span>");

    act(() => {
      document.body.removeChild(element);
    });
    CSSStyleSheet.prototype.replaceSync = originalReplaceSync;
  });

  test("basic element with empty adopted style", async () => {
    mockSupportsAdoptingStyleSheets.mockReturnValue(true);
    const originalReplaceSync = CSSStyleSheet.prototype.replaceSync;
    if (!originalReplaceSync) {
      CSSStyleSheet.prototype.replaceSync = function (
        this: CSSStyleSheet,
        text: string
      ) {
        this.insertRule(text);
      };
    }

    const { defineElement, property } = createDecorators();
    @defineElement("my-element-with-empty-adopted-style")
    class MyElement extends ReactNextElement {
      @property() accessor stringAttr: string | undefined;

      render() {
        return <span>{this.stringAttr}</span>;
      }
    }
    const element = document.createElement(
      "my-element-with-empty-adopted-style"
    ) as MyElement;
    element.stringAttr = "Hi";
    expect(element.shadowRoot).toBeFalsy();
    act(() => {
      document.body.appendChild(element);
    });
    expect(element.shadowRoot?.innerHTML).toBe("<span>Hi</span>");
    expect(element.shadowRoot?.adoptedStyleSheets).toBe(undefined);

    act(() => {
      document.body.removeChild(element);
    });
    CSSStyleSheet.prototype.replaceSync = originalReplaceSync;
  });

  test("lazy connect", async () => {
    const { defineElement, property } = createDecorators();
    @defineElement("my-element-lazy-connect")
    class MyElement extends ReactNextElement {
      @property() accessor stringAttr: string | undefined;

      render() {
        return <span>{this.stringAttr}</span>;
      }
    }
    const element = document.createElement(
      "my-element-lazy-connect"
    ) as MyElement;
    element.stringAttr = "Hi";

    (element as any)._render();

    expect(element.shadowRoot).toBeFalsy();

    act(() => {
      document.body.appendChild(element);
    });
    expect(element.shadowRoot?.innerHTML).toBe("<span>Hi</span>");

    act(() => {
      document.body.removeChild(element);
    });
  });
});
