import { describe, test, expect } from "@jest/globals";
import { act } from "react-dom/test-utils";
import "./index.jsx";
import type { TabItem } from "./index.jsx";
import type { GeneralIconProps } from "@next-bricks/icons/general-icon";

jest.mock("@next-core/theme", () => ({}));

describe("containers.tab-item", () => {
  test("basic usage", async () => {
    const element = document.createElement("containers.tab-item") as TabItem;
    const div = document.createElement("div");
    div.textContent = "Hello world";

    element.append(div);
    element.icon = {} as GeneralIconProps;
    element.disabled = true;
    element.hidden = true;
    element.active = true;

    expect(element.shadowRoot).toBeFalsy();
    act(() => {
      document.body.appendChild(element);
    });
    expect(element.shadowRoot).toBeTruthy();
    expect(element.shadowRoot?.childNodes.length).toBe(2);

    expect(element.textContent).toBe("Hello world");
    expect(element.shadowRoot.querySelector(".tab-item-icon")).toBeTruthy();
    const tabItem = element.shadowRoot.querySelector(
      ".tab-item"
    ) as HTMLElement;
    expect(tabItem.className).toBe("tab-item disabled");
    expect(tabItem.hidden).toBeTruthy();
    expect(tabItem.getAttribute("aria-selected")).toBeTruthy();

    act(() => {
      document.body.removeChild(element);
    });

    expect(document.body.contains(element)).toBeFalsy();
  });
});
