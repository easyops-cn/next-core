import { createBrowserHistory } from "history";
import { PluginHistory } from "@easyops/brick-types";
import { historyExtended } from "./historyExtended";
import { getBasePath } from "./getBasePath";

let history: PluginHistory;

/** @internal */
export function createHistory(): PluginHistory {
  const browserHistory = createBrowserHistory({
    basename: getBasePath().replace(/\/$/, ""),
  });
  Object.assign(browserHistory, historyExtended(browserHistory));
  history = browserHistory as PluginHistory;
  return history;
}

/**
 * 获取系统会话历史管理器。
 *
 * @returns 系统会话历史管理器。
 */
export function getHistory(): PluginHistory {
  return history;
}
