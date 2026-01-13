import { describe, it, afterEach, expect, jest } from "@jest/globals";
import { renderHook } from "@testing-library/react";
import { getRuntime } from "@next-core/runtime";
import { useFeatureFlags } from "./useFeatureFlags.js";

jest.mock("@next-core/runtime");

const mockFeatureFlags = {
  "new-feature": true,
  "experimental-mode": false,
  "beta-ui": true,
};

const mockGetFeatureFlags = jest.fn();
(getRuntime as jest.Mock).mockReturnValue({
  getFeatureFlags: mockGetFeatureFlags,
});

mockGetFeatureFlags.mockReturnValue(mockFeatureFlags);

describe("useFeatureFlags", () => {
  afterEach(() => {
    mockGetFeatureFlags.mockClear();
  });

  it("should return feature flags", () => {
    const { result } = renderHook(() => useFeatureFlags());
    expect(result.current).toEqual(mockFeatureFlags);
  });

  it("should allow checking specific flags", () => {
    const { result } = renderHook(() => useFeatureFlags());

    expect(result.current["new-feature"]).toBe(true);
    expect(result.current["experimental-mode"]).toBe(false);
    expect(result.current["beta-ui"]).toBe(true);
  });

  it("should return empty object when no flags", () => {
    mockGetFeatureFlags.mockReturnValue({});

    const { result } = renderHook(() => useFeatureFlags());
    expect(result.current).toEqual({});
  });

  it("should return undefined for non-existent flags", () => {
    const { result } = renderHook(() => useFeatureFlags());
    expect(result.current["non-existent-flag"]).toBeUndefined();
  });

  it("should call getFeatureFlags only once due to useMemo", () => {
    const { result, rerender } = renderHook(() => useFeatureFlags());
    expect(mockGetFeatureFlags).toHaveBeenCalledTimes(1);
    const firstResult = result.current;

    rerender();
    expect(mockGetFeatureFlags).toHaveBeenCalledTimes(1); // Still 1, useMemo cached
    expect(result.current).toBe(firstResult); // Same reference
  });

  it("should handle flag with default value pattern", () => {
    mockGetFeatureFlags.mockReturnValue({
      "new-feature": true,
      "experimental-mode": false,
    });

    const { result } = renderHook(() => useFeatureFlags());

    // 模拟使用 ?? 运算符提供默认值
    const enabledFlag = result.current["new-feature"] ?? false;
    const missingFlag = result.current["missing-flag"] ?? false;

    expect(enabledFlag).toBe(true);
    expect(missingFlag).toBe(false);
  });
});
