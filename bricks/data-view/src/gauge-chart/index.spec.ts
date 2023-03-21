import { describe, test, expect } from "@jest/globals";
import { act } from "react-dom/test-utils";
import "./index.js";
import { GaugeChart } from "./index.js";

describe("data-view.gauge-chart", () => {
  test("basic usage", async () => {
    const element = document.createElement(
      "data-view.gauge-chart"
    ) as GaugeChart;
    const div = document.createElement("div");
    div.textContent = "Hello world";
    element.value = 40;
    element.radius = 124;
    act(() => {
      element.appendChild(div);
      document.body.appendChild(element);
    });
    expect(element.shadowRoot).toBeTruthy();
    expect(element.innerHTML).toBe("<div>Hello world</div>");
    expect(element.shadowRoot?.childNodes.length).toBe(2);
    act(() => {
      document.body.removeChild(element);
    });
    expect(element.shadowRoot?.childNodes.length).toBe(0);
  });
});
