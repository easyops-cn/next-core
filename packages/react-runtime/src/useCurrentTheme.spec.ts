import { describe, test, expect, jest } from "@jest/globals";
import { renderHook, act } from "@testing-library/react";
import { useCurrentTheme } from "./useCurrentTheme.js";

jest.mock("@next-core/runtime", () => ({
  getCurrentTheme() {
    return "light";
  },
}));

const spyOnAddEventListener = jest.spyOn(window, "addEventListener");
const spyOnRemoveEventListener = jest.spyOn(window, "removeEventListener");

describe("useCurrentTheme", () => {
  test("basic", async () => {
    const { result, rerender, unmount } = renderHook(() => useCurrentTheme());
    expect(result.current).toBe("light");

    act(() => {
      window.dispatchEvent(
        new CustomEvent("theme.change", {
          detail: "dark",
        })
      );
    });

    rerender();

    expect(result.current).toEqual("dark");

    unmount();
    expect(spyOnRemoveEventListener).toBeCalledWith(
      ...spyOnAddEventListener.mock.calls[0]
    );
  });
});
