import { describe, test, expect } from "@jest/globals";
import { act } from "react-dom/test-utils";
import "./index.jsx";
import { Category } from "./index.jsx";

jest.mock("@next-core/theme", () => ({}));

// todo: update unit test
describe("containers.general-category", () => {
  test("basic usage", async () => {
    const element = document.createElement(
      "containers.general-category"
    ) as Category;
    element.category = [
      {
        title: "item1",
        key: "item1",
      },
      {
        title: "item2",
        key: "item2",
      },
    ];

    expect(element.shadowRoot).toBeFalsy();
    act(() => {
      document.body.appendChild(element);
    });
    expect(element.shadowRoot).toBeTruthy();
    expect(element.shadowRoot?.childNodes.length).toBe(2);

    expect(element.shadowRoot.querySelectorAll(".category-item").length).toBe(
      2
    );

    act(() => {
      document.body.removeChild(element);
    });

    expect(document.body.contains(element)).toBeFalsy();
  });
});
