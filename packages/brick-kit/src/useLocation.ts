import React from "react";
import { Location } from "history";
import { PluginHistoryState } from "@easyops/brick-types";
import { getHistory } from "./history";

/** @internal */
export function useLocation(): Location<PluginHistoryState> {
  const history = getHistory();
  const [location, setLocation] = React.useState(history.location);

  React.useEffect(() => {
    const unlisten = history.listen((location) => setLocation(location));
    return unlisten;
  }, [history]);

  return location;
}
