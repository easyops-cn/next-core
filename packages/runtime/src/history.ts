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
  return history ?? getV2History();
}

/**
 * When using v3 bricks in v2 runtime, return history from v2 runtime.
 */
function getV2History() {
  const { dll } = window as unknown as { dll?: DLL };
  if (typeof dll === "function") {
    const LegacyBrickKit = dll("tYg3");
    return LegacyBrickKit.getHistory();
  }
}

interface DLL {
  (moduleId: "tYg3"): {
    getHistory(): NextHistory;
  };
}

export type NextLocation = Location<NextHistoryState>;

export type { NextHistoryState };
