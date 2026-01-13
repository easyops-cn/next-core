import { describe, it, afterEach, expect, jest } from "@jest/globals";
import { renderHook, act } from "@testing-library/react";
import { getHistory } from "@next-core/runtime";
import { useSearchParams } from "./useSearchParams.js";

jest.mock("@next-core/runtime");

const mockListen = jest.fn();
const mockLocation = {
  pathname: "/search",
  search: "?q=test&page=1",
  hash: "",
  state: {},
};

(getHistory as jest.Mock).mockReturnValue({
  location: mockLocation,
  listen: mockListen,
});

describe("useSearchParams", () => {
  afterEach(() => {
    mockListen.mockClear();
  });

  it("should return initial search params", () => {
    const { result } = renderHook(() => useSearchParams());
    expect(result.current.get("q")).toBe("test");
    expect(result.current.get("page")).toBe("1");
  });

  it("should update search params when route changes", () => {
    let listener: any;
    mockListen.mockImplementation((cb) => {
      listener = cb;
      return jest.fn(); // unlisten function
    });

    const { result, rerender } = renderHook(() => useSearchParams());
    expect(result.current.get("q")).toBe("test");

    act(() => {
      listener({
        pathname: "/search",
        search: "?q=newquery&page=2",
        hash: "",
        state: {},
      });
    });

    rerender();
    expect(result.current.get("q")).toBe("newquery");
    expect(result.current.get("page")).toBe("2");
  });

  it("should return empty URLSearchParams when no query string", () => {
    (getHistory as jest.Mock).mockReturnValue({
      location: {
        pathname: "/home",
        search: "",
        hash: "",
        state: {},
      },
      listen: mockListen,
    });

    const { result } = renderHook(() => useSearchParams());
    expect(result.current.toString()).toBe("");
  });

  it("should cleanup listener on unmount", () => {
    const unlistenMock = jest.fn();
    mockListen.mockReturnValue(unlistenMock);

    const { unmount } = renderHook(() => useSearchParams());
    unmount();

    expect(unlistenMock).toHaveBeenCalled();
  });
});
