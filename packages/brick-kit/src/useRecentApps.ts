import React from "react";
import { RecentApps } from "./core/interfaces";
import { getRuntime } from "./runtime";

/** @internal */
export function useRecentApps(): RecentApps {
  const [recentApps, setRecentApps] = React.useState<RecentApps>(
    getRuntime().getRecentApps()
  );

  React.useEffect(() => {
    const listener = ((event: CustomEvent<RecentApps>) => {
      setRecentApps(event.detail);
    }) as EventListener;
    window.addEventListener("app.change", listener);
    return () => window.removeEventListener("app.change", listener);
  }, []);

  return recentApps;
}
