import { describe, test, expect, jest } from "@jest/globals";
import { act } from "react-dom/test-utils";
import "./index.js";
import { GeneralIcon } from "./index.js";

jest.mock("../antd-icon/index.js", () => ({
  WrappedAntdIcon(props: unknown) {
    return JSON.stringify(props);
  },
}));

describe("icons.general-icon", () => {
  test("basic usage", () => {
    const element = document.createElement("icons.general-icon") as GeneralIcon;
    element.lib = "antd";
    element.icon = "branches";

    expect(element.shadowRoot).toBeFalsy();
    act(() => {
      document.body.appendChild(element);
    });
    expect(element.shadowRoot).toBeTruthy();
    expect(element.shadowRoot?.textContent).toMatchInlineSnapshot(
      `"{"icon":"branches"}"`
    );

    act(() => {
      document.body.removeChild(element);
    });
    expect(element.shadowRoot?.textContent).toMatchInlineSnapshot(`""`);
  });
});
