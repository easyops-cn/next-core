import { describe, it, afterEach, expect, jest } from "@jest/globals";
import { renderHook, act } from "@testing-library/react";
import { getHistory } from "@next-core/runtime";
import { useLocation } from "./useLocation.js";

jest.mock("@next-core/runtime");

const mockListen = jest.fn();
const mockLocation = {
  pathname: "/home",
  search: "?tab=overview",
  hash: "#section",
  state: { from: "/" },
};

(getHistory as jest.Mock).mockReturnValue({
  location: mockLocation,
  listen: mockListen,
});

describe("useLocation", () => {
  afterEach(() => {
    mockListen.mockClear();
  });

  it("should return initial location", () => {
    const { result } = renderHook(() => useLocation());
    expect(result.current).toEqual(mockLocation);
    expect(result.current.pathname).toBe("/home");
    expect(result.current.search).toBe("?tab=overview");
    expect(result.current.hash).toBe("#section");
  });

  it("should update location when route changes", () => {
    let listener: any;
    mockListen.mockImplementation((cb) => {
      listener = cb;
      return jest.fn(); // unlisten function
    });

    const { result, rerender } = renderHook(() => useLocation());
    expect(result.current.pathname).toBe("/home");

    const newLocation = {
      pathname: "/about",
      search: "",
      hash: "",
      state: {},
    };

    act(() => {
      listener(newLocation);
    });

    rerender();
    expect(result.current).toEqual(newLocation);
    expect(result.current.pathname).toBe("/about");
  });

  it("should cleanup listener on unmount", () => {
    const unlistenMock = jest.fn();
    mockListen.mockReturnValue(unlistenMock);

    const { unmount } = renderHook(() => useLocation());
    unmount();

    expect(unlistenMock).toHaveBeenCalled();
  });
});
