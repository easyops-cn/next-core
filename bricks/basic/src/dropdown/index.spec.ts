import { describe, test, expect } from "@jest/globals";
import { act } from "react-dom/test-utils";
import "./index.js";
import { Dropdown } from "./index.js";

jest.mock("@next-core/theme", () => ({}));

describe("basic.general-dropdown", () => {
  test("basic usage", async () => {
    const element = document.createElement(
      "basic.general-dropdown"
    ) as Dropdown;

    const button = document.createElement("button");
    button.setAttribute("slot", "trigger");
    button.textContent = "btn";

    const content = document.createElement("div");
    content.textContent = "hello world";

    element.append(button);
    element.append(content);

    expect(element.shadowRoot).toBeFalsy();
    act(() => {
      document.body.appendChild(element);
    });
    expect(element.shadowRoot).toBeTruthy();
    expect(element.shadowRoot?.childNodes.length).toBe(2);

    expect(element.shadowRoot?.querySelector(".close")).toBeTruthy();
    expect(element.shadowRoot?.querySelector(".open")).toBeFalsy();

    act(() => {
      (
        element.shadowRoot?.querySelector("slot[name='trigger']") as HTMLElement
      ).click();
    });

    expect(element.shadowRoot?.querySelector(".open")).toBeTruthy();
    expect(element.shadowRoot?.querySelector(".close")).toBeFalsy();

    act(() => {
      document.body.click();
    });

    expect(element.shadowRoot?.querySelector(".close")).toBeTruthy();
    expect(element.shadowRoot?.querySelector(".open")).toBeFalsy();

    act(() => {
      document.body.removeChild(element);
    });

    expect(document.body.contains(element)).toBeFalsy();
  });
});
