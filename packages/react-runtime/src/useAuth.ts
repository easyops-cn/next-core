import React from "react";
import { auth } from "@next-core/easyops-runtime";

export type AuthInfo = ReturnType<typeof auth.getAuth>;

/**
 * 获取用户认证信息的 React hooks。
 *
 * **注意**: 使用 useMemo 确保返回的认证信息对象引用稳定，
 * 避免不必要的组件重渲染。认证信息在会话期间保持不变。
 *
 * @example
 *
 * ```tsx
 * function MyReactComponent() {
 *   const authInfo = useAuth();
 *   return <div>Username: {authInfo.username}</div>;
 * }
 * ```
 *
 * @returns 当前用户的认证信息对象。
 */
export function useAuth(): AuthInfo {
  return React.useMemo(() => auth.getAuth(), []);
}
