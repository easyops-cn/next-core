import { describe, test, expect } from "@jest/globals";
import { act } from "react-dom/test-utils";
import "./index.js";
import { GridLayout } from "./index.js";

const mediaEventTarget = {
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

window.matchMedia = jest.fn().mockImplementation((query) => {
  return {
    matches: query === "(max-width: 1920px)",
    media: query,
    ...mediaEventTarget,
  };
});

describe("basic.grid-layout", () => {
  test("basic usage", () => {
    const element = document.createElement("basic.grid-layout") as GridLayout;

    expect(element.shadowRoot).toBeFalsy();

    act(() => {
      element.columns = 3;
      element.gap = "20px";
      element.showGridBorder = true;
      document.body.appendChild(element);
    });

    expect(element.shadowRoot).toBeTruthy();
    expect(element.style.gap).toBe("20px");
    expect(element.style.gridTemplateColumns).toBe("repeat(3,1fr)");
    expect(element.style.getPropertyValue("--grid-border-color")).toBe(
      "#454547"
    );

    act(() => {
      document.body.removeChild(element);
    });
    expect(document.body.contains(element)).toBeFalsy();
  });

  test("showGridBorder is true", () => {
    const element = document.createElement("basic.grid-layout") as GridLayout;

    expect(element.shadowRoot).toBeFalsy();

    act(() => {
      element.columns = 3;
      element.rows = 2;
      element.gap = "20px";
      element.columnSpan = 2;
      document.body.appendChild(element);
    });

    expect(element.shadowRoot).toBeTruthy();
    expect(element.style.gap).toBe("20px");
    expect(element.style.gridColumn).toBe("span 2");
    expect(element.style.gridTemplateRows).toBe("repeat(2,1fr)");
    expect(element.style.gridTemplateColumns).toBe("repeat(3,1fr)");
    expect(element.style.getPropertyValue("--grid-border-color")).toBeFalsy();

    act(() => {
      document.body.removeChild(element);
    });
    expect(document.body.contains(element)).toBeFalsy();
  });

  it("should be responsive", async () => {
    const element = document.createElement("basic.grid-layout") as GridLayout;
    Object.assign(element, {
      responsive: {
        large: {
          columns: 6,
          rowSpan: 7,
        },
      },
    });

    await (global as any).flushPromises();
    act(() => {
      document.body.appendChild(element);
    });
    await (global as any).flushPromises();

    expect(mediaEventTarget.addEventListener).toBeCalledTimes(1);
    expect(element.style.gridColumn).toBe("");
    expect(element.style.gridRow).toBe("span 7");

    act(() => {
      document.body.removeChild(element);
    });
    await (global as any).flushPromises();
    expect(mediaEventTarget.removeEventListener).toBeCalledTimes(1);
    expect(document.body.contains(element)).toBeFalsy();
  });
});
