import React from "react";
import { __secret_internals } from "@next-core/runtime";

/**
 * 获取当前路由路径参数的 React hooks。
 *
 * **注意**: 此 hook 依赖于运行时上下文中的路由匹配信息。
 * 如果在非路由上下文中使用，将返回空对象。
 *
 * 此 hook 监听 `page.load` 事件以确保在路由匹配完成后更新路径参数。
 * 直接监听 history 变化无法获取正确的参数，因为路由匹配是异步的。
 *
 * @example
 *
 * ```tsx
 * function MyReactComponent() {
 *   const pathParams = usePathParams();
 *   return <div>User ID: {pathParams.userId}</div>;
 * }
 * ```
 *
 * @returns 当前路由的路径参数对象。
 */
export function usePathParams(): Record<string, string> {
  const [pathParams, setPathParams] = React.useState<Record<string, string>>(
    () => extractPathParams()
  );

  React.useEffect(() => {
    const listener = (() => {
      setPathParams(extractPathParams());
    }) as EventListener;

    // 监听 page.load 事件，此时路由匹配已完成，match 信息已更新
    window.addEventListener("page.load", listener);
    return () => window.removeEventListener("page.load", listener);
  }, []);

  return pathParams;
}

/**
 * 从运行时上下文中提取路径参数。
 *
 * @internal
 */
function extractPathParams(): Record<string, string> {
  try {
    // 使用 __secret_internals 获取当前运行时值
    const runtimeValue = __secret_internals.getLegalRuntimeValue();
    return runtimeValue?.match?.params ?? {};
  } catch (_error) {
    // 如果运行时上下文不可用，返回空对象
    return {};
  }
}
