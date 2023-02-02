import React from "react";
import { describe, test, expect, jest } from "@jest/globals";
import { act } from "react-dom/test-utils";
import { render } from "@testing-library/react";
import { ButtonComponent } from "./index.js";

describe("basic.demo-button", () => {
  test("basic usage", () => {
    const element = document.createElement("basic.demo-button");

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

describe("ButtonComponent", () => {
  test("basic usage", () => {
    const { container } = render(<ButtonComponent label="Hello" />);
    expect(container.querySelector("button")).toBeTruthy();
    expect(container.querySelector("button").textContent).toContain("Hello");
  });
});
