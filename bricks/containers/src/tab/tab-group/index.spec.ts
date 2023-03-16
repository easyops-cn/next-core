import { describe, test, expect } from "@jest/globals";
import { act } from "react-dom/test-utils";
import "./index.jsx";
import type { TabGroup } from "./index.jsx";

jest.mock("@next-core/theme", () => ({}));

// todo: update unit test
describe("containers.tab-list", () => {
  test("basic usage", async () => {
    const element = document.createElement("containers.tab-group") as TabGroup;

    expect(element.shadowRoot).toBeFalsy();
    act(() => {
      document.body.appendChild(element);
    });
    expect(element.shadowRoot).toBeTruthy();
    expect(element.shadowRoot?.childNodes.length).toBe(2);

    act(() => {
      document.body.removeChild(element);
    });

    expect(document.body.contains(element)).toBeFalsy();
  });
});
