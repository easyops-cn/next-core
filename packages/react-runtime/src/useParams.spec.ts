import { describe, it, afterEach, expect, jest } from "@jest/globals";
import { renderHook, act } from "@testing-library/react";
import { getHistory } from "@next-core/runtime";
import { useParams } from "./useParams.js";

jest.mock("@next-core/runtime");

const mockListen = jest.fn();

(getHistory as jest.Mock).mockReturnValue({
  location: {
    search: "?id=123&name=test",
  },
  listen: mockListen,
});

describe("useParams", () => {
  afterEach(() => {
    mockListen.mockClear();
  });

  it("should return initial query params as object", () => {
    const { result } = renderHook(() => useParams());
    expect(result.current).toEqual({ id: "123", name: "test" });
  });

  it("should update params when route changes", () => {
    let listener: any;
    mockListen.mockImplementation((cb) => {
      listener = cb;
      return jest.fn(); // unlisten function
    });

    const { result } = renderHook(() => useParams());
    expect(result.current).toEqual({ id: "123", name: "test" });

    act(() => {
      listener({ search: "?id=456&name=updated" });
    });

    expect(result.current).toEqual({ id: "456", name: "updated" });
  });

  it("should return empty object when no query params", () => {
    (getHistory as jest.Mock).mockReturnValue({
      location: {
        search: "",
      },
      listen: mockListen,
    });

    const { result } = renderHook(() => useParams());
    expect(result.current).toEqual({});
  });

  it("should handle URL encoded values", () => {
    (getHistory as jest.Mock).mockReturnValue({
      location: {
        search: "?name=%E6%B5%8B%E8%AF%95&value=hello%20world",
      },
      listen: mockListen,
    });

    const { result } = renderHook(() => useParams());
    expect(result.current).toEqual({ name: "测试", value: "hello world" });
  });

  it("should handle duplicate params by keeping last value", () => {
    (getHistory as jest.Mock).mockReturnValue({
      location: {
        search: "?id=1&id=2&id=3",
      },
      listen: mockListen,
    });

    const { result } = renderHook(() => useParams());
    expect(result.current).toEqual({ id: "3" });
  });

  it("should cleanup listener on unmount", () => {
    const unlistenMock = jest.fn();
    mockListen.mockReturnValue(unlistenMock);

    (getHistory as jest.Mock).mockReturnValue({
      location: {
        search: "?id=123",
      },
      listen: mockListen,
    });

    const { unmount } = renderHook(() => useParams());
    unmount();

    expect(unlistenMock).toHaveBeenCalled();
  });
});
