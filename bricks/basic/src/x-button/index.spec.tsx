import React from "react";
import { describe, test, expect, jest } from "@jest/globals";
import { act } from "react-dom/test-utils";
import { render } from "@testing-library/react";
import { XButtonComponent } from "./index.js";

describe("basic.x-button", () => {
  test("should create a custom element", () => {
    const element = document.createElement("basic.x-button");

    expect(element.shadowRoot).toBeFalsy();
    act(() => {
      document.body.appendChild(element);
    });
    expect(element.shadowRoot).toBeTruthy();
    expect(element.shadowRoot.childNodes.length).toBe(2);

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
      document.body.removeChild(element);
    });
    expect(element.shadowRoot.childNodes.length).toBe(0);
  });
});

describe("XButtonComponent", () => {
  test("", () => {
    const { container } = render(<XButtonComponent label="Hello" />);
    expect(container.querySelector("button")).toBeTruthy();
    expect(container.querySelector("button").textContent).toContain("Hello");
  });
});
