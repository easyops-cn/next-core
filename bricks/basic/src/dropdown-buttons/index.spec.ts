import { describe, test, expect } from "@jest/globals";
import { act, Simulate } from "react-dom/test-utils";
import "./index.jsx";
import { DropButton } from "./index.jsx";

jest.mock("@next-core/theme", () => ({}));

describe("basic.dropdown-buttons", () => {
  test("basic usage", async () => {
    const element = document.createElement(
      "basic.dropdown-buttons"
    ) as DropButton;

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
        {
          text: "c",
          event: "c.click",
          href: "www.baidu.com",
          icon: {
            lib: "antd",
            icon: "setting",
            theme: "filled",
          },
        },
      ];
      document.body.appendChild(element);
    });
    expect(element.shadowRoot).toBeTruthy();
    expect(element.shadowRoot?.childNodes.length).toBe(2);

    const dropButton = element.shadowRoot.querySelector(".dropdown-button");
    expect(dropButton?.innerHTML).toBe("Hello world");
    expect(element.shadowRoot.querySelector(".buttons-list")).toBeFalsy();

    act(() => {
      Simulate.click(dropButton as HTMLElement);
    });

    expect(element.shadowRoot.querySelector(".buttons-list")).toBeTruthy();

    const listItem = element.shadowRoot.querySelectorAll(
      ".dropdown-button-item"
    );
    expect(listItem[0].innerHTML).toBe("a");
    expect(listItem[1].innerHTML).toBe("b");
    expect(listItem[2].innerHTML).toEqual(
      '<icons.general-icon class="dropdown-button-icon" lib="antd" icon="setting" theme="filled"></icons.general-icon><a href="www.baidu.com">c</a>'
    );

    act(() => {
      Simulate.click(listItem[1]);
    });
    // click disabled item not close the list
    expect(element.shadowRoot.querySelector(".buttons-list")).toBeTruthy();

    act(() => {
      Simulate.click(listItem[0]);
    });

    expect(element.shadowRoot.querySelector(".buttons-list")).toBeFalsy();

    act(() => {
      Simulate.click(dropButton as HTMLElement);
    });
    expect(element.shadowRoot.querySelector(".buttons-list")).toBeTruthy();

    act(() => {
      Simulate.click(dropButton as HTMLElement);
    });
    expect(element.shadowRoot.querySelector(".buttons-list")).toBeFalsy();

    act(() => {
      document.body.removeChild(element);
    });
    expect(element.shadowRoot?.childNodes.length).toBe(0);
  });
});
