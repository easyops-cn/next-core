import { describe, test, expect } from "@jest/globals";
import { act } from "react-dom/test-utils";
import "./index.js";
import { DropdownButton } from "./index.js";

jest.mock("@next-core/theme", () => ({}));

describe("basic.dropdown-button", () => {
  test("basic usage", async () => {
    const element = document.createElement(
      "basic.dropdown-button"
    ) as DropdownButton;

    expect(element.shadowRoot).toBeFalsy();
    act(() => {
      element.btnText = "Hello world";
      element.size = "large";
      element.actions = [
        {
          text: "a",
          event: "a.click",
        },
        {
          text: "b",
          event: "b.click",
          disabled: true,
        },
      ];
      document.body.appendChild(element);
    });
    expect(element.shadowRoot).toBeTruthy();
    expect(element.shadowRoot?.childNodes.length).toBe(1);

    const mockAClick = jest.fn();
    const mockBClick = jest.fn();
    element.addEventListener("a.click", mockAClick);
    element.addEventListener("b.click", mockBClick);

    expect(element.shadowRoot?.innerHTML).toMatchInlineSnapshot(
      `"<basic.general-dropdown><basic.general-button slot="trigger" size="large" icon="[object Object]">Hello world</basic.general-button><basic.general-menu><basic.general-menu-item text="a" event="a.click">a</basic.general-menu-item><basic.general-menu-item text="b" event="b.click" disabled="">b</basic.general-menu-item></basic.general-menu></basic.general-dropdown>"`
    );

    act(() => {
      (
        element.shadowRoot?.children[0]?.children[1]?.children[0] as HTMLElement
      ).click();
    });

    expect(mockAClick).toBeCalledTimes(1);

    act(() => {
      (
        element.shadowRoot?.children[0]?.children[1]?.children[0] as HTMLElement
      ).click();
    });

    expect(mockBClick).toBeCalledTimes(0);

    act(() => {
      document.body.removeChild(element);
    });

    expect(document.body.contains(element)).toBeFalsy();
  });
});
