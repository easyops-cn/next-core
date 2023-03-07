import { describe, test, expect } from "@jest/globals";
import { act } from "react-dom/test-utils";
import "./index.jsx";
import { Image } from "./index.jsx";

jest.mock("@next-core/theme", () => ({}));

// Todo(nlicro): fix test fail
describe("basic.general-image", () => {
  test("basic usage", () => {
    const onVisibleChange = jest.fn();
    const element = document.createElement("basic.general-image") as Image;
    element.addEventListener("visibleChange", onVisibleChange);

    expect(element.shadowRoot).toBeFalsy();
    act(() => {
      document.body.appendChild(element);
    });
    expect(element.shadowRoot).toBeTruthy();

    act(() => {
      element.open();
    });
    expect(onVisibleChange).lastCalledWith(
      expect.objectContaining({
        type: "visibleChange",
        detail: true,
      })
    );

    act(() => {
      element.close();
    });
    expect(onVisibleChange).lastCalledWith(
      expect.objectContaining({
        type: "visibleChange",
        detail: false,
      })
    );
  });
});
