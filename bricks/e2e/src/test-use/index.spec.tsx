import { describe, test, expect, jest } from "@jest/globals";
import { act } from "react-dom/test-utils";
import "./";
import type { TestUse } from "./index.js";

jest.mock("@next-core/theme", () => ({}));

describe("e2e.test-use", () => {
  test("basic usage", async () => {
    const element = document.createElement("e2e.test-use") as TestUse;

    expect(element.shadowRoot).toBeFalsy();

    act(() => {
      document.body.appendChild(element);
    });
    expect(element.shadowRoot?.childNodes.length).toBeGreaterThan(1);

    act(() => {
      document.body.removeChild(element);
    });
    expect(element.shadowRoot?.childNodes.length).toBe(0);
  });
});
