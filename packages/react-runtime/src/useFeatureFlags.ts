import React from "react";
import { getRuntime } from "@next-core/runtime";
import type { FeatureFlags } from "@next-core/types";

/**
 * 获取特性开关配置的 React hooks。
 *
 * 特性开关用于控制功能的启用或禁用，可以在全局设置或应用级别配置。
 * 使用 useMemo 确保返回的对象引用稳定，避免不必要的组件重渲染。
 *
 * @example
 *
 * ```tsx
 * function MyReactComponent() {
 *   const flags = useFeatureFlags();
 *
 *   if (flags["my-new-feature"]) {
 *     return <NewFeature />;
 *   }
 *
 *   return <OldFeature />;
 * }
 * ```
 *
 * @example
 *
 * ```tsx
 * // 检查特定功能是否启用
 * function FeatureToggle() {
 *   const flags = useFeatureFlags();
 *   const isEnabled = flags["experimental-mode"] ?? false;
 *
 *   return (
 *     <div>
 *       Experimental Mode: {isEnabled ? "ON" : "OFF"}
 *     </div>
 *   );
 * }
 * ```
 *
 * @returns 特性开关配置对象，键为特性名称，值为布尔值。
 */
export function useFeatureFlags(): FeatureFlags {
  return React.useMemo(() => getRuntime().getFeatureFlags(), []);
}
