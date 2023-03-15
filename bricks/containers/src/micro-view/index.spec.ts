import { describe, test, expect } from "@jest/globals";
import { act } from "react-dom/test-utils";
import "./index.js";
import { MicroView } from "./index.js";

jest.mock("@next-core/theme", () => ({}));

describe("containers.micro-view", () => {
  test("basic usage", async () => {
    const element = document.createElement(
      "containers.micro-view"
    ) as MicroView;
    element.pageTitle = "hello world";

    expect(element.shadowRoot).toBeFalsy();
    act(() => {
      document.body.appendChild(element);
    });
    expect(element.shadowRoot).toBeTruthy();
    expect(element.shadowRoot?.childNodes.length).toBe(2);

    expect(
      (element.shadowRoot?.querySelector(".header") as HTMLElement)?.style
        .margin
    ).toBe("9px 0px");

    act(() => {
      document.body.removeChild(element);
    });

    expect(document.body.contains(element)).toBeFalsy();
  });

  test("hide header", () => {
    const element = document.createElement(
      "containers.micro-view"
    ) as MicroView;

    act(() => {
      document.body.appendChild(element);
    });

    expect(
      (element.shadowRoot?.querySelector(".header") as HTMLElement)?.style
        .margin
    ).toBe("");

    act(() => {
      document.body.removeChild(element);
    });

    expect(document.body.contains(element)).toBeFalsy();
  });
});
