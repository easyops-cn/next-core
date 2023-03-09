import { describe, test, expect } from "@jest/globals";
import { act } from "react-dom/test-utils";
import "./index.js";
import { Tag } from "./index.js";

jest.mock("@next-core/theme", () => ({}));

describe("basic.general-tag", () => {
  test("basic usage", async () => {
    const element = document.createElement("basic.general-tag") as Tag;
    const div = document.createElement("div");
    div.textContent = "Hello world";
    element.color = "yellow";
    element.size = "large";
    element.checkable = true;
    element.checked = true;
    element.closable = true;
    element.icon = {} as any;

    act(() => {
      element.appendChild(div);
      document.body.appendChild(element);
    });
    expect(element.shadowRoot).toBeTruthy();
    expect(element.shadowRoot?.childNodes.length).toBe(2);

    expect(
      (element.shadowRoot?.querySelector(".tag") as HTMLElement).className
    ).toBe("tag large color-yellow checkable checked");
    expect(
      element.shadowRoot?.querySelector(".tag-icon.custom-icon")
    ).toBeTruthy();
    expect(
      element.shadowRoot?.querySelector(".tag-icon.close-icon")
    ).toBeTruthy();
    expect(element.innerHTML).toBe("<div>Hello world</div>");

    const mockCheckFn = jest.fn();
    const mockCloseFn = jest.fn();
    element.addEventListener("check", mockCheckFn);
    element.addEventListener("close", mockCloseFn);

    act(() => {
      (element.shadowRoot?.querySelector(".tag") as HTMLElement).click();
      (
        element.shadowRoot?.querySelector(".tag-icon.close-icon") as HTMLElement
      ).click();
    });

    expect(mockCheckFn).toBeCalled();
    expect(mockCloseFn).toBeCalled();
    expect(
      (element.shadowRoot?.querySelector(".tag") as HTMLElement).className
    ).toBe("tag large color-yellow checkable");

    act(() => {
      document.body.removeChild(element);
    });

    expect(document.body.contains(element)).toBeFalsy();
  });

  test("when disabled state and close icon should be hidden, with custom color", () => {
    const element = document.createElement("basic.general-tag") as Tag;
    const div = document.createElement("div");
    div.textContent = "Hello world";
    element.appendChild(div);
    element.color = "pink";
    element.disabled = true;
    element.closable = true;

    expect(element.shadowRoot).toBeFalsy();
    act(() => {
      document.body.appendChild(element);
    });
    expect(element.shadowRoot).toBeTruthy();
    expect(element.shadowRoot?.childNodes.length).toBe(2);

    expect(
      (element.shadowRoot?.querySelector(".tag") as HTMLElement).style.color
    ).toBe("rgb(255, 255, 255)");
    expect(
      (element.shadowRoot?.querySelector(".tag") as HTMLElement).style
        .background
    ).toBe("pink");
    expect(
      element.shadowRoot?.querySelector(".tag-icon.close-icon")
    ).toBeFalsy();
    act(() => {
      document.body.removeChild(element);
    });

    expect(document.body.contains(element)).toBeFalsy();
  });
});
