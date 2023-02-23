import React from "react";
import { describe, test, expect, jest } from "@jest/globals";
import { act } from "react-dom/test-utils";
import { render } from "@testing-library/react";
import "./index.js";
import { XButton, XButtonComponent } from "./index.js";

describe("demo-basic.x-button", () => {
  test("basic usage", () => {
    const element = document.createElement("demo-basic.x-button") as XButton;

    expect(element.shadowRoot).toBeFalsy();
    act(() => {
      document.body.appendChild(element);
    });
    expect(element.shadowRoot).toBeTruthy();
    expect(element.shadowRoot.childNodes.length).toBe(2);

    const listener = jest.fn();
    element.addEventListener("oops", listener);
    element.triggerClick();
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
  test("basic usage", () => {
    const { container } = render(<XButtonComponent label="Oops" />);
    expect(container.querySelector("button")).toBeTruthy();
    expect(container.querySelector("button").textContent).toContain("Oops");
  });
});
