import { createBrowserHistory } from "history";
import { PluginHistory } from "@easyops/brick-types";

let history: PluginHistory;

export function createHistory(): PluginHistory {
  const base = document.querySelector("base");
  const baseHref = base ? base.getAttribute("href") : "/";
  history = createBrowserHistory({
    basename: baseHref.replace(/\/$/, "")
  });
  return history;
}

export function getHistory(): PluginHistory {
  return history;
}
