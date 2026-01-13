import React from "react";
import { getHistory } from "@next-core/runtime";

/**
 * 获取 URL query 参数的 React hooks，返回普通对象。
 *
 * 与 `useSearchParams` 不同，此 hook 返回一个普通的键值对象，
 * 而不是 URLSearchParams 实例，使用更方便。
 *
 * **注意**:
 * - 重复的参数只会保留最后一个值
 * - 所有值都是字符串类型
 * - 参数值会自动进行 URL 解码
 *
 * @example
 *
 * ```tsx
 * // URL: /page?id=123&name=test
 * function MyReactComponent() {
 *   const params = useParams();
 *   return <div>ID: {params.id}, Name: {params.name}</div>;
 * }
 * ```
 *
 * @returns URL query 参数对象。
 */
export function useParams(): Record<string, string> {
  const [params, setParams] = React.useState<Record<string, string>>(() =>
    extractParams(getHistory().location.search)
  );

  React.useEffect(() => {
    const unlisten = getHistory().listen((location) => {
      setParams(extractParams(location.search));
    });
    return unlisten;
  }, []);

  return params;
}

/**
 * 从 query string 中提取参数对象。
 *
 * @internal
 */
function extractParams(search: string): Record<string, string> {
  const params: Record<string, string> = {};
  const urlSearchParams = new URLSearchParams(search);

  urlSearchParams.forEach((value, key) => {
    params[key] = value;
  });

  return params;
}
