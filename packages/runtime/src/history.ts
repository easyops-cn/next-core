import { History, Location, createBrowserHistory } from "history";
import { getBasePath } from "./getBasePath.js";
import {
  type ExtendedHistory,
  getUserConfirmation,
  historyExtended,
  NextHistoryState,
} from "./internal/historyExtended.js";
import { getV2RuntimeFromDll } from "./getV2RuntimeFromDll.js";

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

function getHistoryV3(): NextHistory {
  return history;
}

/**
 * When using v3 bricks in v2 container, return history from v2 container.
 */
function getHistoryV2Factory() {
  const v2Kit = getV2RuntimeFromDll();
  if (v2Kit) {
    return v2Kit.getHistory;
  }
}

export const getHistory = getHistoryV2Factory() || getHistoryV3;

export type NextLocation = Location<NextHistoryState>;

export type { NextHistoryState };
