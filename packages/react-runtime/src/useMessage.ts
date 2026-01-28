import React from "react";
import { Notification } from "@next-core/runtime";

export interface Message {
  /**
   * 显示成功消息。
   * @param message - 要显示的消息内容
   */
  success: (message: string) => void;

  /**
   * 显示错误消息。
   * @param message - 要显示的消息内容
   */
  error: (message: string) => void;

  /**
   * 显示信息消息。
   * @param message - 要显示的消息内容
   */
  info: (message: string) => void;

  /**
   * 显示警告消息。
   * @param message - 要显示的消息内容
   */
  warn: (message: string) => void;
}

/**
 * 获取 message 对象的 React hooks,用于显示通知消息。
 *
 * **注意**: 使用 useMemo 确保返回的 message 对象引用稳定，
 * 避免不必要的组件重渲染。这在对象被用于依赖数组或传递给记忆化组件时尤为重要。
 *
 * @example
 *
 * ```tsx
 * function MyReactComponent() {
 *   const message = useMessage();
 *   const handleSuccess = () => {
 *     message.success("操作成功!");
 *   };
 *   const handleError = () => {
 *     message.error("操作失败!");
 *   };
 *   return (
 *     <div>
 *       <button onClick={handleSuccess}>成功</button>
 *       <button onClick={handleError}>失败</button>
 *     </div>
 *   );
 * }
 * ```
 *
 * @returns message 对象,包含 success、error、info、warn 四个方法。
 */
export function useMessage(): Message {
  return React.useMemo(
    () => ({
      success: (message: string) => {
        Notification.show({ type: "success", message });
      },
      error: (message: string) => {
        Notification.show({ type: "error", message });
      },
      info: (message: string) => {
        Notification.show({ type: "info", message });
      },
      warn: (message: string) => {
        Notification.show({ type: "warn", message });
      },
    }),
    []
  );
}
