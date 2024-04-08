import { describe, test, expect, jest } from "@jest/globals";
import { renderHook, act } from "@testing-library/react";
import { useNavConfig } from "./useNavConfig.js";

jest.mock("@next-core/runtime", () => ({
  getRuntime() {
    return {
      getNavConfig() {
        return { breadcrumb: [] };
      },
    };
  },
}));

const spyOnAddEventListener = jest.spyOn(window, "addEventListener");
const spyOnRemoveEventListener = jest.spyOn(window, "removeEventListener");

describe("useNavConfig", () => {
  test("basic", async () => {
    const { result, rerender, unmount } = renderHook(() => useNavConfig());
    expect(result.current).toEqual({ breadcrumb: [] });

    act(() => {
      window.dispatchEvent(
        new CustomEvent("navConfig.change", {
          detail: { breadcrumb: [{ text: "Test" }] },
        })
      );
    });

    rerender();

    expect(result.current).toEqual({ breadcrumb: [{ text: "Test" }] });

    unmount();
    expect(spyOnRemoveEventListener).toBeCalledWith(
      ...spyOnAddEventListener.mock.calls[0]
    );
  });
});
