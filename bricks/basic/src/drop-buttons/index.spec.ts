import { describe, test, expect } from "@jest/globals";
import { act, Simulate } from "react-dom/test-utils";
import "./";
import { DropButton } from "./index.js";

jest.mock("@next-core/theme", () => ({}));

describe("basic.drop-buttons", () => {
  test("basic usage", async () => {
    const element = document.createElement("basic.drop-buttons") as DropButton;

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

    const dropButton = element.shadowRoot.querySelector(".drop-button");
    expect(dropButton?.innerHTML).toBe("Hello world");
    expect(element.shadowRoot.querySelector(".buttons-list")).toBeFalsy();

    act(() => {
      Simulate.click(dropButton as HTMLElement);
    });

    expect(element.shadowRoot.querySelector(".buttons-list")).toBeTruthy();

    const listItem = element.shadowRoot.querySelectorAll(".drop-button-item");
    expect(listItem[0].innerHTML).toBe("a");
    expect(listItem[1].innerHTML).toBe("b");
    expect(listItem[2].innerHTML).toEqual(
      '<icons.general-icon class="drop-button-icon" lib="antd" icon="setting" theme="filled"></icons.general-icon><a href="www.baidu.com">c</a>'
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
