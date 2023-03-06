import React from "react";
import { MicroApp } from "@next-core/types";
import { getRuntime } from "@next-core/runtime";

export interface RecentApps {
  currentApp?: MicroApp;
  previousApp?: MicroApp;
}

export function useRecentApps(): RecentApps {
  const [recentApps, setRecentApps] = React.useState<RecentApps>(() =>
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
