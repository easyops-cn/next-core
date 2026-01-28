import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { renderHook } from "@testing-library/react";
import { Notification } from "@next-core/runtime";
import { useMessage } from "./useMessage.js";

jest.mock("@next-core/runtime");

const mockNotificationShow = jest.fn();

(Notification.show as jest.Mock) = mockNotificationShow;

describe("useMessage", () => {
  beforeEach(() => {
    mockNotificationShow.mockClear();
  });

  it("should return message object with all methods", () => {
    const { result } = renderHook(() => useMessage());
    expect(result.current).toHaveProperty("success");
    expect(result.current).toHaveProperty("error");
    expect(result.current).toHaveProperty("info");
    expect(result.current).toHaveProperty("warn");
  });

  it("should call Notification.show with success type", () => {
    const { result } = renderHook(() => useMessage());
    result.current.success("操作成功");
    expect(mockNotificationShow).toHaveBeenCalledWith({
      type: "success",
      message: "操作成功",
    });
  });

  it("should call Notification.show with error type", () => {
    const { result } = renderHook(() => useMessage());
    result.current.error("操作失败");
    expect(mockNotificationShow).toHaveBeenCalledWith({
      type: "error",
      message: "操作失败",
    });
  });

  it("should call Notification.show with info type", () => {
    const { result } = renderHook(() => useMessage());
    result.current.info("提示信息");
    expect(mockNotificationShow).toHaveBeenCalledWith({
      type: "info",
      message: "提示信息",
    });
  });

  it("should call Notification.show with warn type", () => {
    const { result } = renderHook(() => useMessage());
    result.current.warn("警告信息");
    expect(mockNotificationShow).toHaveBeenCalledWith({
      type: "warn",
      message: "警告信息",
    });
  });

  it("should handle multiple calls", () => {
    const { result } = renderHook(() => useMessage());
    result.current.success("第一条消息");
    result.current.error("第二条消息");
    expect(mockNotificationShow).toHaveBeenCalledTimes(2);
  });

  it("should maintain reference stability across re-renders", () => {
    const { result, rerender } = renderHook(() => useMessage());
    const firstResult = result.current;

    rerender();
    expect(result.current).toBe(firstResult); // Same reference due to useMemo
  });
});
