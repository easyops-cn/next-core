import { describe, test, expect } from "@jest/globals";
import { act } from "react-dom/test-utils";
import "./index.jsx";
import { ModernStylePageTitle } from "./index.jsx";

describe("data-view.modern-style-page-title", () => {
  test("basic usage", async () => {
    const element = document.createElement(
      "data-view.modern-style-page-title"
    ) as ModernStylePageTitle;

    element.pageTitle = "page-title";
    element.description = "--description--";
    element.backgroundStyle = { background: "green" };
    element.leftRoundStyle = { background: "red" };
    element.rightRoundStyle = { background: "blue" };

    expect(element.shadowRoot).toBeFalsy();
    act(() => {
      document.body.appendChild(element);
    });
    expect(element.shadowRoot).toBeTruthy();

    expect(element.shadowRoot.querySelector(".title-text").textContent).toBe(
      "page-title"
    );
    expect(element.shadowRoot.querySelector(".description").textContent).toBe(
      "--description--"
    );
    expect(
      (
        element.shadowRoot.querySelector(
          ".background-container"
        ) as HTMLDivElement
      ).style.background
    ).toBe("green");
    expect(
      (element.shadowRoot.querySelector(".left-round") as HTMLDivElement).style
        .background
    ).toBe("red");
    expect(
      (element.shadowRoot.querySelector(".right-round") as HTMLDivElement).style
        .background
    ).toBe("blue");

    act(() => {
      document.body.removeChild(element);
    });

    expect(document.body.contains(element)).toBeFalsy();
  });
});
