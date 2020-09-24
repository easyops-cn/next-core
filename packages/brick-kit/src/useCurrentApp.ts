import { MicroApp } from "@easyops/brick-types";
import { useRecentApps } from "./useRecentApps";

/**
 * 获取当前所在微应用信息的 React hooks。
 *
 * @example
 *
 * ```tsx
 * function MyReactComponent() {
 *   const app = useCurrentApp();
 *   return <div>{app.id}</div>;
 * }
 * ```
 *
 * @returns 当前所在微应用的信息。
 */
export function useCurrentApp(): MicroApp {
  return useRecentApps().currentApp;
}
