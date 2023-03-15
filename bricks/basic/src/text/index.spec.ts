import { describe, test, expect } from "@jest/globals";
import { act } from "react-dom/test-utils";
import "./index.js";
import { Text } from "./index.js";
describe("basic.general-text", () => {
  test("basic usage", async () => {
    const element = document.createElement("basic.general-text") as Text;
    const div = document.createElement("div");
    div.textContent = "Hello world";
    element.color = "blue";
    element.fontSize = "20px";
    element.display = "block";
    element.textAlign = "center";
    element.lineHeight = "20px";
    act(() => {
      element.appendChild(div);
      document.body.appendChild(element);
    });
    expect(element.shadowRoot).toBeTruthy();
    expect(element.innerHTML).toBe("<div>Hello world</div>");

    act(() => {
      document.body.removeChild(element);
    });
    expect(document.body.contains(element)).toBeFalsy();
  });
});
