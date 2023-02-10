import React from "react";
import { describe, test, expect } from "@jest/globals";
import { act } from "react-dom/test-utils";
import "./index.js";

describe("basic.demo-button", () => {
  test("basic usage", () => {
    const element = document.createElement("basic.flex-layout");

    expect(element.shadowRoot).toBeFalsy();
    act(() => {
      element.flexDirection = "row";
      document.body.appendChild(element);
    });
    expect(element.shadowRoot).toBeTruthy();
    expect(element.shadowRoot.childNodes.length).toBe(3);

    expect(
      element.shadowRoot?.querySelectorAll("style")[1]?.textContent
    ).toContain("flex-direction: row;");

    act(() => {
      document.body.removeChild(element);
    });
    expect(element.shadowRoot.childNodes.length).toBe(0);
  });
});
