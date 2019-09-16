import React from "react";
import { MicroApp } from "@easyops/brick-types";

export function useCurrentApp(): MicroApp {
  const [app, setApp] = React.useState<MicroApp>();

  React.useEffect(() => {
    const listener = ((event: CustomEvent<{ currentApp: MicroApp }>) => {
      setApp(event.detail.currentApp);
    }) as EventListener;
    window.addEventListener("app.change", listener);
    return () => window.removeEventListener("app.change", listener);
  });

  return app;
}
