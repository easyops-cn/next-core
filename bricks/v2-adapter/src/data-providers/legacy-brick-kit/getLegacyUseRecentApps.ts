import type React from "react";
import { MicroApp } from "@next-core/types";
import { getRuntime } from "@next-core/runtime";

export interface RecentApps {
  currentApp?: MicroApp;
  previousApp?: MicroApp;
}

export function getLegacyUseRecentApps(LegacyReact: typeof React) {
  function useRecentApps(): RecentApps {
    const [recentApps, setRecentApps] = LegacyReact.useState<RecentApps>(
      getRuntime().getRecentApps()
    );

    LegacyReact.useEffect(() => {
      const listener = ((event: CustomEvent<RecentApps>) => {
        setRecentApps(event.detail);
      }) as EventListener;
      window.addEventListener("app.change", listener);
      return () => window.removeEventListener("app.change", listener);
    }, []);

    return recentApps;
  }

  function useCurrentApp() {
    return useRecentApps().currentApp;
  }

  return {
    useRecentApps,
    useCurrentApp,
  };
}
