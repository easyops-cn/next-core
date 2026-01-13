import { describe, it, afterEach, expect, jest } from "@jest/globals";
import { renderHook } from "@testing-library/react";
import { auth } from "@next-core/easyops-runtime";
import { useAuth } from "./useAuth.js";

jest.mock("@next-core/easyops-runtime");

const mockAuth = {
  username: "testuser",
  org: 123,
};

const mockGetAuth = jest.fn();
(auth as any).getAuth = mockGetAuth;
mockGetAuth.mockReturnValue(mockAuth);

describe("useAuth", () => {
  afterEach(() => {
    mockGetAuth.mockClear();
  });

  it("should return auth info", () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current).toEqual(mockAuth);
  });

  it("should return empty object when no auth", () => {
    mockGetAuth.mockReturnValue({});

    const { result } = renderHook(() => useAuth());
    expect(result.current).toEqual({});
  });

  it("should call auth.getAuth only once due to useMemo", () => {
    const { result, rerender } = renderHook(() => useAuth());
    expect(mockGetAuth).toHaveBeenCalledTimes(1);
    const firstResult = result.current;

    rerender();
    expect(mockGetAuth).toHaveBeenCalledTimes(1); // Still 1, useMemo cached
    expect(result.current).toBe(firstResult); // Same reference
  });
});
