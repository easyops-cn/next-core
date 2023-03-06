import { describe, test, expect } from "@jest/globals";
import { act } from "react-dom/test-utils";
import "./";
import { Button } from "./index.js";

jest.mock("@next-core/theme", () => ({}));

describe("basic.general-button", () => {
  test("basic usage", async () => {
    const element = document.createElement("basic.general-button") as Button;

    expect(element.shadowRoot).toBeFalsy();
    act(() => {
      element.textContent = "Hello world";
      element.size = "large";
      element.type = "primary";
      document.body.appendChild(element);
    });
    expect(element.shadowRoot).toBeTruthy();
    expect(element.shadowRoot?.childNodes.length).toBe(2);

    const button = element.shadowRoot?.querySelector("button");
    const icon = element.shadowRoot?.querySelector(".icon");
    expect(button?.className).toBe("large primary");
    expect(icon).toBe(null);

    act(() => {
      document.body.removeChild(element);
    });
    expect(element.shadowRoot?.childNodes.length).toBe(0);
  });

  test("danger button", async () => {
    const element = document.createElement("basic.general-button") as Button;

    expect(element.shadowRoot).toBeFalsy();
    act(() => {
      element.textContent = "Hello world";
      element.danger = true;
      document.body.appendChild(element);
    });
    expect(element.shadowRoot).toBeTruthy();
    expect(element.shadowRoot?.childNodes.length).toBe(2);

    const button = element.shadowRoot?.querySelector("button");
    expect(button?.className).toBe("middle default danger");

    act(() => {
      document.body.removeChild(element);
    });
    expect(element.shadowRoot?.childNodes.length).toBe(0);
  });

  test("link button", async () => {
    const element1 = document.createElement("basic.general-button") as Button;
    const element2 = document.createElement("basic.general-button") as Button;

    expect(element1.shadowRoot).toBeFalsy();
    act(() => {
      element1.textContent = "Hello world";
      element1.type = "link";
      element1.href = "www.baidu.com";
      element2.type = "link";
      document.body.appendChild(element1);
      document.body.appendChild(element2);
    });
    expect(element1.shadowRoot).toBeTruthy();
    expect(element1.shadowRoot?.childNodes.length).toBe(2);

    const button1 = element1.shadowRoot?.querySelector("button");
    const button2 = element2.shadowRoot?.querySelector("button");
    const link1 = element1.shadowRoot?.querySelector("a");
    const link2 = element2.shadowRoot?.querySelector("a");
    expect(button1).toBe(null);
    expect(link1?.className).toBe("middle");
    expect(button2?.className).toBe("middle link");
    expect(link2).toBe(null);

    act(() => {
      document.body.removeChild(element1);
      document.body.removeChild(element2);
    });
    expect(element1.shadowRoot?.childNodes.length).toBe(0);
    expect(element2.shadowRoot?.childNodes.length).toBe(0);
  });

  test("button with icon", async () => {
    const element = document.createElement("basic.general-button") as Button;

    expect(element.shadowRoot).toBeFalsy();
    act(() => {
      element.icon = {
        lib: "antd",
        icon: "setting",
        theme: "filled",
      };
      element.shape = "circle";
      document.body.appendChild(element);
    });
    expect(element.shadowRoot).toBeTruthy();
    expect(element.shadowRoot?.childNodes.length).toBe(2);

    const icon = element.shadowRoot?.querySelector(".icon");
    expect(icon?.tagName).toBe("ICONS.GENERAL-ICON");

    act(() => {
      document.body.removeChild(element);
    });
    expect(element.shadowRoot?.childNodes.length).toBe(0);
  });
});
