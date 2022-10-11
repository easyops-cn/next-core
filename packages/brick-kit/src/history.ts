import { createBrowserHistory } from "history";
import { PluginHistory } from "@next-core/brick-types";
import {
  getUserConfirmation,
  historyExtended,
} from "./internal/historyExtended";
import { getBasePath } from "./internal/getBasePath";

let history: PluginHistory;

/** @internal */
export function createHistory(): PluginHistory {
  const browserHistory = createBrowserHistory({
    basename: getBasePath().replace(/\/$/, ""),
    getUserConfirmation,
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
