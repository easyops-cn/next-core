import { createBrowserHistory } from "history";
import { PluginHistory } from "@easyops/brick-types";
import { historyExtended } from "./historyExtended";

let history: PluginHistory;

export function createHistory(): PluginHistory {
  const base = document.querySelector("base");
  const baseHref = base ? base.getAttribute("href") : "/";
  const browserHistory = createBrowserHistory({
    basename: baseHref.replace(/\/$/, "")
  });
  history = {
    ...browserHistory,
    ...historyExtended(browserHistory)
  };
  return history;
}

export function getHistory(): PluginHistory {
  return history;
}
