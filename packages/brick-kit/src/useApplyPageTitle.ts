import { useEffect } from "react";
import { getRuntime } from "./runtime";

/**
 * 设置页面标题，将更新浏览器标签页显示的标题。
 *
 * @example
 *
 * ```tsx
 * function MyReactComponent(props) {
 *   useApplyPageTitle(props.pageTitle);
 *   // ...
 * }
 * ```
 *
 * @param pageTitle - 页面标题。
 */
export function useApplyPageTitle(pageTitle: string): void {
  useEffect(() => {
    getRuntime().applyPageTitle(pageTitle);
  }, [pageTitle]);
}
