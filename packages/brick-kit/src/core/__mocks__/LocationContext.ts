import {
  RuntimeStoryboard,
  RouteConf,
  Storyboard,
} from "@next-core/brick-types";
import { MountRoutesResult } from "../LocationContext";

let _matchedStoryboard: RuntimeStoryboard;
let _mountRoutesResultsData: MountRoutesResult;
let _mountRoutesResultsError: Error;

export const __setMatchedStoryboard = (value: RuntimeStoryboard): void => {
  _matchedStoryboard = value;
};

export const __setMountRoutesResults = (
  value: MountRoutesResult,
  err: Error
): void => {
  _mountRoutesResultsError = err;
  _mountRoutesResultsData = value;
};

export class LocationContext {
  resolver = {
    resetRefreshQueue: jest.fn(),
    scheduleRefreshing: jest.fn(),
  };
  messageDispatcher = {
    create: jest.fn(),
    reset: jest.fn(),
  };

  handleBeforePageLoad = jest.fn();
  handlePageLoad = jest.fn();
  handleBeforePageLeave = jest.fn();
  handlePageLeave = jest.fn();
  handleAnchorLoad = jest.fn();
  handleMessage = jest.fn();
  getCurrentMatch = jest.fn(() => ({ path: "/developers" }));
  handleBrickBindObserver = jest.fn();
  storyboardContextWrapper = {
    waitForAllContext: jest.fn().mockResolvedValue(undefined),
  };

  matchStoryboard(): RuntimeStoryboard {
    return _matchedStoryboard;
  }

  mountRoutes(
    routes: RouteConf[],
    slotId: string,
    result: MountRoutesResult
  ): Promise<void> {
    Object.assign(result, _mountRoutesResultsData);
    if (_mountRoutesResultsError !== null) {
      throw _mountRoutesResultsError;
    }
    return Promise.resolve();
  }

  getCurrentContext(): any {
    return {};
  }

  getSubStoryboardByRoute(storyboard: Storyboard): Storyboard {
    return {
      ...storyboard,
    };
  }
}
