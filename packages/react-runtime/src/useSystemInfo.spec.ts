import { describe, it, afterEach, expect, jest } from "@jest/globals";
import { renderHook } from "@testing-library/react";
import { getRuntime, getPageInfo } from "@next-core/runtime";
import { auth } from "@next-core/easyops-runtime";
import { useSystemInfo } from "./useSystemInfo.js";

jest.mock("@next-core/runtime");
jest.mock("@next-core/easyops-runtime");

const mockAuth = {
  username: "testuser",
  userInstanceId: "user123",
  org: 8888,
};

const mockPageInfo = {
  isInIframe: false,
  isInIframeOfSameSite: false,
  isInIframeOfNext: false,
  isInIframeOfVisualBuilder: false,
  isInIframeOfLegacyConsole: false,
};

const mockBrandSettings = {
  base_title: "DevOps 管理专家",
  custom_title: "Custom Brand",
};

const mockGetBrandSettings = jest.fn();
(auth as any).getAuth = jest.fn();
(getPageInfo as jest.Mock).mockReturnValue(mockPageInfo);
(getRuntime as jest.Mock).mockReturnValue({
  getBrandSettings: mockGetBrandSettings,
});

(auth.getAuth as jest.Mock).mockReturnValue(mockAuth);
mockGetBrandSettings.mockReturnValue(mockBrandSettings);

describe("useSystemInfo", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return system info with auth, page info and brand settings", () => {
    const { result } = renderHook(() => useSystemInfo());

    expect(result.current.username).toBe("testuser");
    expect(result.current.userInstanceId).toBe("user123");
    expect(result.current.org).toBe(8888);
    expect(result.current.isInIframe).toBe(false);
    expect(result.current.settings.brand).toEqual(mockBrandSettings);
  });

  it("should include all page info properties", () => {
    const { result } = renderHook(() => useSystemInfo());

    expect(result.current.isInIframe).toBe(false);
    expect(result.current.isInIframeOfSameSite).toBe(false);
    expect(result.current.isInIframeOfNext).toBe(false);
    expect(result.current.isInIframeOfVisualBuilder).toBe(false);
    expect(result.current.isInIframeOfLegacyConsole).toBe(false);
  });

  it("should handle iframe mode", () => {
    (getPageInfo as jest.Mock).mockReturnValue({
      ...mockPageInfo,
      isInIframe: true,
      isInIframeOfNext: true,
    });

    const { result } = renderHook(() => useSystemInfo());

    expect(result.current.isInIframe).toBe(true);
    expect(result.current.isInIframeOfNext).toBe(true);
  });

  it("should memoize result to avoid unnecessary re-renders", () => {
    const { result, rerender } = renderHook(() => useSystemInfo());
    const firstResult = result.current;

    rerender();
    expect(result.current).toBe(firstResult); // Same reference
  });

  it("should handle empty auth info", () => {
    (auth.getAuth as jest.Mock).mockReturnValue({});

    const { result } = renderHook(() => useSystemInfo());

    expect(result.current.username).toBeUndefined();
    expect(result.current.org).toBeUndefined();
    expect(result.current.settings.brand).toEqual(mockBrandSettings);
  });

  it("should include brand settings in settings object", () => {
    const { result } = renderHook(() => useSystemInfo());

    expect(result.current.settings).toBeDefined();
    expect(result.current.settings.brand).toEqual(mockBrandSettings);
    expect(result.current.settings.brand.base_title).toBe("DevOps 管理专家");
  });
});
