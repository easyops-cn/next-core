import React from "react";

interface RouteRender {
  renderTime?: number;
}

export function useRouteRender(): RouteRender | null {
  const [routeRender, setRouteRender] = React.useState<RouteRender | null>(
    null
  );

  React.useEffect(() => {
    const listener = ((event: CustomEvent<RouteRender>) => {
      setRouteRender(event.detail);
    }) as EventListener;
    window.addEventListener("route.render", listener);
    return () => window.removeEventListener("route.render", listener);
  }, []);

  return routeRender;
}
