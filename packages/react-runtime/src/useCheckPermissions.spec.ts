import { describe, it, afterEach, expect, jest } from "@jest/globals";
import { renderHook } from "@testing-library/react";
import { checkPermissions } from "@next-core/easyops-runtime";
import { useCheckPermissions } from "./useCheckPermissions.js";

jest.mock("@next-core/easyops-runtime");

const mockCheckPermissions = jest.fn();

(checkPermissions as any).checkPermissions = mockCheckPermissions;

describe("useCheckPermissions", () => {
  afterEach(() => {
    mockCheckPermissions.mockClear();
  });

  it("should return true when user has permission", () => {
    mockCheckPermissions.mockReturnValue(true);

    const { result } = renderHook(() =>
      useCheckPermissions("my-app:user.read")
    );

    expect(result.current).toBe(true);
    expect(mockCheckPermissions).toHaveBeenCalledWith("my-app:user.read");
  });

  it("should return false when user lacks permission", () => {
    mockCheckPermissions.mockReturnValue(false);

    const { result } = renderHook(() =>
      useCheckPermissions("my-app:user.delete")
    );

    expect(result.current).toBe(false);
    expect(mockCheckPermissions).toHaveBeenCalledWith("my-app:user.delete");
  });

  it("should check multiple permissions", () => {
    mockCheckPermissions.mockReturnValue(true);

    const { result } = renderHook(() =>
      useCheckPermissions("my-app:user.read", "my-app:user.write")
    );

    expect(result.current).toBe(true);
    expect(mockCheckPermissions).toHaveBeenCalledWith(
      "my-app:user.read",
      "my-app:user.write"
    );
  });

  it("should return false when any permission is missing", () => {
    mockCheckPermissions.mockReturnValue(false);

    const { result } = renderHook(() =>
      useCheckPermissions(
        "my-app:user.read",
        "my-app:user.write",
        "my-app:user.delete"
      )
    );

    expect(result.current).toBe(false);
  });

  it("should memoize result based on actions", () => {
    mockCheckPermissions.mockReturnValue(true);

    const { result, rerender } = renderHook(
      ({ actions }) => useCheckPermissions(...actions),
      {
        initialProps: { actions: ["my-app:user.read"] },
      }
    );

    expect(result.current).toBe(true);
    expect(mockCheckPermissions).toHaveBeenCalledTimes(1);

    // Rerender with same actions
    rerender({ actions: ["my-app:user.read"] });
    expect(mockCheckPermissions).toHaveBeenCalledTimes(1); // Still 1, memoized

    // Rerender with different actions
    rerender({ actions: ["my-app:user.write"] });
    expect(mockCheckPermissions).toHaveBeenCalledTimes(2); // New call
  });

  it("should handle empty actions array", () => {
    mockCheckPermissions.mockReturnValue(true);

    const { result } = renderHook(() => useCheckPermissions());

    expect(result.current).toBe(true);
    expect(mockCheckPermissions).toHaveBeenCalledWith();
  });

  it("should work with admin users", () => {
    // Admin users always return true
    mockCheckPermissions.mockReturnValue(true);

    const { result } = renderHook(() =>
      useCheckPermissions("my-app:admin.any-action")
    );

    expect(result.current).toBe(true);
  });

  it("should work with non-logged-in users", () => {
    // Non-logged-in users always return false
    mockCheckPermissions.mockReturnValue(false);

    const { result } = renderHook(() =>
      useCheckPermissions("my-app:user.read")
    );

    expect(result.current).toBe(false);
  });

  it("should handle permission not in preCheck", () => {
    // Un-checked permissions return false
    mockCheckPermissions.mockReturnValue(false);

    const { result } = renderHook(() =>
      useCheckPermissions("my-app:unchecked.action")
    );

    expect(result.current).toBe(false);
  });
});
