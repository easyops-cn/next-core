import { describe, test, expect } from "@jest/globals";
import { act } from "react-dom/test-utils";
import "./index.js";
import { MenuItem } from "./index.js";

jest.mock("@next-core/theme", () => ({}));

describe("basic.general-menu", () => {
  test("basic usage", async () => {
    const element = document.createElement(
      "basic.general-menu-item"
    ) as MenuItem;
    element.textContent = "Menu Item";
    element.icon = {
      lib: "antd",
      theme: "outlined",
      icon: "close",
    };

    expect(element.shadowRoot).toBeFalsy();
    act(() => {
      document.body.appendChild(element);
    });
    expect(element.shadowRoot).toBeTruthy();
    expect(element.shadowRoot?.childNodes.length).toBe(2);

    expect(
      element.shadowRoot?.querySelector(".menu-item.disabled")
    ).toBeFalsy();
    expect(element.shadowRoot?.querySelector(".menu-item-icon")).toBeTruthy();

    const mockClickEvent = jest.fn();
    element.addEventListener("click", mockClickEvent);

    expect(mockClickEvent).toBeCalledTimes(0);
    (element.shadowRoot?.querySelector(".menu-item") as HTMLElement)?.click();

    expect(mockClickEvent).toBeCalledTimes(1);

    act(() => {
      document.body.removeChild(element);
    });

    expect(document.body.contains(element)).toBeFalsy();
  });

  test("disabled and click event not emit", () => {
    const element = document.createElement(
      "basic.general-menu-item"
    ) as MenuItem;
    element.textContent = "Menu Item";
    element.disabled = true;
    expect(element.shadowRoot).toBeFalsy();
    act(() => {
      document.body.appendChild(element);
    });
    expect(element.shadowRoot).toBeTruthy();
    expect(element.shadowRoot?.childNodes.length).toBe(2);

    const mockClickEvent = jest.fn();
    element.addEventListener("click", mockClickEvent);

    expect(mockClickEvent).toBeCalledTimes(0);
    (element.shadowRoot?.querySelector(".menu-item") as HTMLElement)?.click();

    expect(mockClickEvent).toBeCalledTimes(0);

    act(() => {
      document.body.removeChild(element);
    });

    expect(document.body.contains(element)).toBeFalsy();
  });
});
