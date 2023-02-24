import { History, Location, createBrowserHistory } from "history";
import { getBasePath } from "./getBasePath.js";
import {
  type ExtendedHistory,
  getUserConfirmation,
  historyExtended,
  NextHistoryState,
} from "./internal/historyExtended.js";

export type NextHistory = History<NextHistoryState> & ExtendedHistory;

let history: NextHistory;

export function createHistory(): NextHistory {
  if (!history) {
    // https://github.com/remix-run/history/issues/810
    const browserHistory = createBrowserHistory<NextHistoryState>({
      basename: getBasePath().replace(/\/$/, ""),
      getUserConfirmation,
    });
    Object.assign(browserHistory, historyExtended(browserHistory));
    history = browserHistory as NextHistory;
  }
  return history;
}

export function getHistory(): NextHistory {
  return history;
}

export type NextLocation = Location<NextHistoryState>;

export type { NextHistoryState };
