import React from "react";
import { getHistory, type NextLocation } from "@next-core/runtime";

/**
 * 获取当前路由 location 对象的 React hooks。
 *
 * @example
 *
 * ```tsx
 * function MyReactComponent() {
 *   const location = useLocation();
 *   return <div>Current path: {location.pathname}</div>;
 * }
 * ```
 *
 * @returns 当前路由的 location 对象。
 */
export function useLocation(): NextLocation {
  const [location, setLocation] = React.useState<NextLocation>(
    () => getHistory().location
  );

  React.useEffect(() => {
    const unlisten = getHistory().listen((newLocation) => {
      setLocation(newLocation);
    });
    return unlisten;
  }, []);

  return location;
}
