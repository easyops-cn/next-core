import { describe, test, expect } from "@jest/globals";
import { act } from "react-dom/test-utils";
import "./index.jsx";
import { ModernStyleComponentTitle } from "./index.jsx";

describe("data-view.modern-style-component-title", () => {
  test("basic usage", async () => {
    const element = document.createElement(
      "data-view.modern-style-component-title"
    ) as ModernStyleComponentTitle;

    element.hideLeftComponent = false;
    element.hideRightComponent = true;
    element.componentTitle = "应用网络带宽趋势";
    element.titleTextStyle = { color: "red" };
    element.squareColor = "green";

    expect(element.shadowRoot).toBeFalsy();
    act(() => {
      document.body.appendChild(element);
    });
    expect(element.shadowRoot).toBeTruthy();

    expect(element.shadowRoot.querySelector(".title-text").textContent).toBe(
      "应用网络带宽趋势"
    );
    expect(
      (element.shadowRoot.querySelector(".title-text") as HTMLDivElement).style
        .color
    ).toBe("red");
    expect(
      (element.shadowRoot.querySelector(".blue-slash") as HTMLDivElement).style
        .backgroundColor
    ).toBe("green");

    expect(
      element.shadowRoot.querySelector(".left-slash-component")
    ).toBeTruthy();
    expect(
      element.shadowRoot.querySelector(".right-slash-component")
    ).toBeFalsy();
    expect(
      element.shadowRoot.querySelector("slot[name='toolbar']")
    ).toBeTruthy();

    act(() => {
      document.body.removeChild(element);
    });

    expect(document.body.contains(element)).toBeFalsy();
  });
});
