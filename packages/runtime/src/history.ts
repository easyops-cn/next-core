import { createBrowserHistory } from "history";
import type { PluginHistory, PluginHistoryState } from "@next-core/brick-types";
import { getBasePath } from "./getBasePath.js";
import {
  getUserConfirmation,
  historyExtended,
} from "./internal/historyExtended.js";

let history: PluginHistory;

export function createHistory(): PluginHistory {
  // https://github.com/remix-run/history/issues/810
  const browserHistory = createBrowserHistory<PluginHistoryState>({
    basename: getBasePath().replace(/\/$/, ""),
    getUserConfirmation,
  });
  Object.assign(browserHistory, historyExtended(browserHistory));
  history = browserHistory as PluginHistory;
  return history;
}

export function getHistory(): PluginHistory {
  return history;
}
