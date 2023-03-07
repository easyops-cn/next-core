import { describe, test, expect } from "@jest/globals";
import { act, Simulate } from "react-dom/test-utils";
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
      element.buttons = [
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
    expect(element.shadowRoot?.childNodes.length).toBe(2);

    const mockAClick = jest.fn();
    const mockBClick = jest.fn();
    element.addEventListener("a.click", mockAClick);
    element.addEventListener("b.click", mockBClick);

    const dropButton = element.shadowRoot?.querySelector(".dropdown-button");
    expect(dropButton?.innerHTML).toBe("Hello world");

    expect(element.shadowRoot?.innerHTML).toMatchInlineSnapshot(
      `"<style>dropdown-buttons.shadow.css</style><basic.general-dropdown><basic.general-button slot="trigger" class="dropdown-button" size="large" icon="[object Object]">Hello world</basic.general-button><basic.general-menu><basic.general-menu-item text="a" event="a.click">a</basic.general-menu-item><basic.general-menu-item text="b" event="b.click" disabled="">b</basic.general-menu-item></basic.general-menu></basic.general-dropdown>"`
    );

    act(() => {
      Simulate.click(
        element.shadowRoot?.children[1]?.children[1]?.children[0] as HTMLElement
      );
    });

    expect(mockAClick).toBeCalledTimes(1);

    act(() => {
      Simulate.click(
        element.shadowRoot?.children[1]?.children[1]?.children[0] as HTMLElement
      );
    });

    expect(mockBClick).toBeCalledTimes(0);

    act(() => {
      document.body.removeChild(element);
    });

    expect(document.body.contains(element)).toBeFalsy();
  });
});
