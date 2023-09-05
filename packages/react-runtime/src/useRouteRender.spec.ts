import { describe, it, expect, jest } from "@jest/globals";
import { renderHook, act } from "@testing-library/react";
import { useRouteRender } from "./useRouteRender.js";

const spyOnAddEventListener = jest.spyOn(window, "addEventListener");
const spyOnRemoveEventListener = jest.spyOn(window, "removeEventListener");

describe("useRouteRender", () => {
  it("should work", async () => {
    const { result, rerender, unmount } = renderHook(() => useRouteRender());
    expect(result.current).toEqual(null);

    act(() => {
      window.dispatchEvent(
        new CustomEvent("route.render", {
          detail: {
            renderTime: 1500,
          },
        })
      );
    });

    rerender();

    expect(result.current).toEqual({
      renderTime: 1500,
    });

    unmount();
    expect(spyOnRemoveEventListener).toBeCalledWith(
      ...spyOnAddEventListener.mock.calls[0]
    );
  });
});
