import { getHistory, type NextHistory } from "@next-core/runtime";

/**
 * 获取 history 对象的 React hooks。
 *
 * @example
 *
 * ```tsx
 * function MyReactComponent() {
 *   const history = useHistory();
 *   const handleClick = () => {
 *     history.push('/new-page');
 *   };
 *   return <button onClick={handleClick}>Navigate</button>;
 * }
 * ```
 *
 * @returns history 对象,用于路由导航。
 */
export function useHistory(): NextHistory {
  return getHistory();
}
