import { describe, it, afterEach, expect, jest } from "@jest/globals";
import { renderHook, act } from "@testing-library/react";
import { getRuntime } from "@next-core/runtime";
import { useCurrentApp } from "./useCurrentApp.js";

jest.mock("@next-core/runtime");

const getRecentApps = jest.fn();
(getRuntime as jest.Mock).mockReturnValue({
  getRecentApps,
});

const spyOnAddEventListener = jest.spyOn(window, "addEventListener");
const spyOnRemoveEventListener = jest.spyOn(window, "removeEventListener");

describe("useCurrentApp", () => {
  afterEach(() => {
    getRecentApps.mockReset();
  });

  it("should work", async () => {
    getRecentApps.mockReturnValue({});

    const { result, rerender, unmount } = renderHook(() => useCurrentApp());
    expect(result.current).toBe(undefined);

    act(() => {
      window.dispatchEvent(
        new CustomEvent("app.change", {
          detail: {
            currentApp: {
              id: "hello",
            },
          },
        })
      );
    });

    rerender();

    expect(result.current).toEqual({ id: "hello" });

    unmount();
    expect(spyOnRemoveEventListener).toBeCalledWith(
      ...spyOnAddEventListener.mock.calls[0]
    );
  });

  it("should work when render after recent apps exists", () => {
    getRecentApps.mockReturnValue({
      currentApp: { id: "good" },
    });

    const { result, rerender, unmount } = renderHook(() => useCurrentApp());
    expect(result.current).toEqual({ id: "good" });

    act(() => {
      window.dispatchEvent(
        new CustomEvent("app.change", {
          detail: {
            currentApp: {
              id: "hello",
            },
          },
        })
      );
    });

    rerender();

    expect(result.current).toEqual({ id: "hello" });

    unmount();
    expect(spyOnRemoveEventListener).toBeCalledWith(
      ...spyOnAddEventListener.mock.calls[0]
    );
  });
});
