import { describe, it, afterEach, expect, jest } from "@jest/globals";
import { renderHook, act } from "@testing-library/react";
import { __secret_internals } from "@next-core/runtime";
import { usePathParams } from "./usePathParams.js";

jest.mock("@next-core/runtime");

const mockGetLegalRuntimeValue = jest.fn();

(__secret_internals as any).getLegalRuntimeValue = mockGetLegalRuntimeValue;

describe("usePathParams", () => {
  afterEach(() => {
    mockGetLegalRuntimeValue.mockClear();
  });

  it("should return initial path params", () => {
    mockGetLegalRuntimeValue.mockReturnValue({
      match: {
        params: {
          userId: "123",
        },
      },
    });

    const { result } = renderHook(() => usePathParams());
    expect(result.current).toEqual({ userId: "123" });
  });

  it("should update path params when page.load event fires", () => {
    mockGetLegalRuntimeValue.mockReturnValue({
      match: {
        params: {
          userId: "123",
        },
      },
    });

    const { result } = renderHook(() => usePathParams());
    expect(result.current).toEqual({ userId: "123" });

    // 模拟路由变化后的 page.load 事件
    mockGetLegalRuntimeValue.mockReturnValue({
      match: {
        params: {
          userId: "456",
        },
      },
    });

    act(() => {
      window.dispatchEvent(new CustomEvent("page.load"));
    });

    expect(result.current).toEqual({ userId: "456" });
  });

  it("should return empty object when no params", () => {
    mockGetLegalRuntimeValue.mockReturnValue({
      match: {
        params: {},
      },
    });

    const { result } = renderHook(() => usePathParams());
    expect(result.current).toEqual({});
  });

  it("should return empty object when match is undefined", () => {
    mockGetLegalRuntimeValue.mockReturnValue({});

    const { result } = renderHook(() => usePathParams());
    expect(result.current).toEqual({});
  });

  it("should cleanup listener on unmount", () => {
    const removeEventListenerSpy = jest.spyOn(window, "removeEventListener");

    mockGetLegalRuntimeValue.mockReturnValue({});

    const { unmount } = renderHook(() => usePathParams());
    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "page.load",
      expect.any(Function)
    );

    removeEventListenerSpy.mockRestore();
  });

  it("should return empty object when getLegalRuntimeValue throws error", () => {
    mockGetLegalRuntimeValue.mockImplementation(() => {
      throw new Error("Runtime context not available");
    });

    const { result } = renderHook(() => usePathParams());
    expect(result.current).toEqual({});
  });
});
