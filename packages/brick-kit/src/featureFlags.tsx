import React, { createContext, useContext } from "react";
import { FeatureFlags as FeatureFlagsType } from "@next-core/brick-types";
const FeatureFlagsContext = createContext<FeatureFlagsType>(null);

export const FeatureFlagsProvider = FeatureFlagsContext.Provider;

interface featureFlagsProps {
  name: string | string[];
  fallback?: React.ReactNode | React.ReactElement;
}

/**
 * 显示特性开关
 *
 * @example
 *
 * ```tsx
 * featureFlags = {"enabled-foo": true, "enabled-bar": true}
 *
 * function MyReactComponent(props) {
 *   // 返回所有的特性开关名称数组
 *   const featureFlags = useFeatureFlags();
 *   console.log(featureFlags)
 *   // Output: ["enabled-foo", "enabled-bar"]
 *
 *   // ...
 * }
 *
 * featureFlags = {"enabled-foo": true}
 * function MyReactComponent(props) {
 *   // 返回传入的特性开关名布尔值数组
 *   const [isEnabledFoo, isEnabledBar] = useFeatureFlags(["enabled-foo", "enabled-bar"]);
 *   console.log([isEnabledFoo, isEnabledBar])
 *   // Output: [true, false]
 *
 *   // ...
 * }
 * ```
 *
 * @param name - 特性开关名称
 *
 * @returns boolean[] | string[]
 */
export function useFeatureFlags(
  name?: string | string[]
): boolean[] | string[] {
  const featureFlags = useContext(FeatureFlagsContext);
  const flagNames = [].concat(name).filter(Boolean);
  return flagNames.length
    ? flagNames.map((flag) => !!featureFlags[flag])
    : Object.keys(featureFlags).filter((flag) => !!featureFlags[flag]);
}

/**
 * 特性开关 React 组件
 * @example
 *
 * ```tsx
 * featureFlags = {"enabled-foo": true}
 *
 * <DisplayByFeatureFlags name={["enable-foo"]}>
 *   <div>Can you see me?</div>
 * </DisplayByFeatureFlags>
 * // 显示 `Can you see me?`
 *
 *
 * featureFlags = {"enabled-foo": true}
 * <DisplayByFeatureFlags fallback={<h1>Good to see you.</h1>} name={"enable-bar"}>
 *   <div>Can you see me?</div>
 * </DisplayByFeatureFlags>
 * // 显示 `Good to see you.`
 *
 * ```
 * @param name - 特性开关名称
 *
 * @param fallback - 如果没有开启传入的特性开关则渲染此属性内传入的 React Node
 */
export function DisplayByFeatureFlags(
  props: React.PropsWithChildren<featureFlagsProps>
): React.ReactElement {
  const featureFlags = useFeatureFlags(props.name) as boolean[];

  return featureFlags.every((flag) => !!flag) ? (
    <>{props.children}</>
  ) : props?.fallback ? (
    <>{props?.fallback}</>
  ) : null;
}
