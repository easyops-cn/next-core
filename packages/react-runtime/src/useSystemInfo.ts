import React from "react";
import { getRuntime, getPageInfo } from "@next-core/runtime";
import { auth } from "@next-core/easyops-runtime";
import type { PageInfo } from "@next-core/runtime";

/**
 * 系统信息接口，包含认证信息、页面信息和品牌设置。
 */
export interface SystemInfo extends PageInfo {
  /** 用户认证信息 */
  username?: string;
  userInstanceId?: string;
  org?: number;
  [key: string]: unknown;

  /** 系统设置 */
  settings: {
    /** 品牌设置 */
    brand: Record<string, string>;
  };
}

/**
 * 获取系统信息的 React hooks。
 *
 * 系统信息包括：
 * - 用户认证信息（username, userInstanceId, org 等）
 * - 页面信息（isInIframe, isInIframeOfNext 等）
 * - 品牌设置（base_title 等）
 *
 * **注意**: 使用 useMemo 确保返回的对象引用稳定，
 * 避免不必要的组件重渲染。系统信息在会话期间保持稳定。
 *
 * @example
 *
 * ```tsx
 * function MyReactComponent() {
 *   const sys = useSystemInfo();
 *
 *   return (
 *     <div>
 *       <p>User: {sys.username}</p>
 *       <p>Org: {sys.org}</p>
 *       <p>In iframe: {sys.isInIframe ? "Yes" : "No"}</p>
 *       <p>Brand: {sys.settings.brand.base_title}</p>
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 *
 * ```tsx
 * // 检查是否在 iframe 中
 * function IframeDetector() {
 *   const sys = useSystemInfo();
 *
 *   if (sys.isInIframe) {
 *     return <div>Running in iframe mode</div>;
 *   }
 *
 *   return <div>Running in standalone mode</div>;
 * }
 * ```
 *
 * @returns 系统信息对象。
 */
export function useSystemInfo(): SystemInfo {
  return React.useMemo(() => {
    const authInfo = auth.getAuth();
    const pageInfo = getPageInfo();
    const brandSettings = getRuntime().getBrandSettings();

    return {
      ...authInfo,
      ...pageInfo,
      settings: {
        brand: brandSettings,
      },
    };
  }, []);
}
