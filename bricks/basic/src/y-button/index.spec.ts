import { describe, test, expect, jest } from "@jest/globals";
import { act } from "react-dom/test-utils";
import "./index.js";

describe("basic.y-button", () => {
  test("should create a custom element", () => {
    // const container = document.createElement("div");
    // container.innerHTML = '<basic.y-button label="Hi:"></basic.y-button>';
    // const target = container;
    // const element = container.firstElementChild as HTMLElement;
    const element = document.createElement("basic.y-button");
    // (element as any).label = "Hi:";
    element.setAttribute("label", "Hi:");
    const target = element;

    expect(element.shadowRoot).toBeFalsy();
    act(() => {
      document.body.appendChild(target);
    });
    expect(element.shadowRoot).toBeTruthy();
    expect(element.shadowRoot.childNodes.length).toBe(2);

    expect(element.shadowRoot.innerHTML).toMatchInlineSnapshot(`
      "<style>x-button.shadow.css
      y-button.shadow.css</style><button>Hi:<slot></slot>!!</button>"
    `);

    const listener = jest.fn();
    element.addEventListener("oops", listener);
    element.click();
    expect(listener).toBeCalledTimes(1);
    expect(listener).toBeCalledWith(
      expect.objectContaining({
        type: "oops",
        detail: "ok",
      })
    );

    act(() => {
      document.body.removeChild(target);
    });
    expect(element.shadowRoot.childNodes.length).toBe(0);
  });
});
