import React from "react";
import { getHistory } from "@next-core/runtime";

/**
 * 获取当前 URL 查询参数的 React hooks。
 *
 * @example
 *
 * ```tsx
 * function MyReactComponent() {
 *   const searchParams = useSearchParams();
 *   return <div>Search query: {searchParams.get('q')}</div>;
 * }
 * ```
 *
 * @returns 当前 URL 的查询参数 URLSearchParams 对象。
 */
export function useSearchParams(): URLSearchParams {
  const [searchParams, setSearchParams] = React.useState<URLSearchParams>(
    () => new URLSearchParams(getHistory().location.search)
  );

  React.useEffect(() => {
    const unlisten = getHistory().listen((location) => {
      setSearchParams(new URLSearchParams(location.search));
    });
    return unlisten;
  }, []);

  return searchParams;
}
