import { describe, test, expect } from "@jest/globals";
import { act } from "react-dom/test-utils";
import "./index.js";
import { Menu } from "./index.js";

jest.mock("@next-core/theme", () => ({}));

describe("basic.general-menu", () => {
  test("basic usage", async () => {
    const element = document.createElement("basic.general-menu") as Menu;

    expect(element.shadowRoot).toBeFalsy();
    act(() => {
      document.body.appendChild(element);
    });
    expect(element.shadowRoot).toBeTruthy();
    expect(element.shadowRoot?.childNodes.length).toBe(2);
  });
});
