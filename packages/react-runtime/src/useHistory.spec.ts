import { describe, it, expect, jest } from "@jest/globals";
import { renderHook } from "@testing-library/react";
import { getHistory } from "@next-core/runtime";
import { useHistory } from "./useHistory.js";

jest.mock("@next-core/runtime");

const mockHistory = {
  push: jest.fn(),
  replace: jest.fn(),
  go: jest.fn(),
  goBack: jest.fn(),
  goForward: jest.fn(),
  location: {
    pathname: "/",
    search: "",
    hash: "",
    state: {},
  },
  listen: jest.fn(),
};

(getHistory as jest.Mock).mockReturnValue(mockHistory);

describe("useHistory", () => {
  it("should return history object", () => {
    const { result } = renderHook(() => useHistory());
    expect(result.current).toBe(mockHistory);
  });

  it("should have navigation methods", () => {
    const { result } = renderHook(() => useHistory());
    expect(result.current.push).toBe(mockHistory.push);
    expect(result.current.replace).toBe(mockHistory.replace);
    expect(result.current.go).toBe(mockHistory.go);
    expect(result.current.goBack).toBe(mockHistory.goBack);
    expect(result.current.goForward).toBe(mockHistory.goForward);
  });
});
