import { RuntimeStoryboard, RouteConf } from "@easyops/brick-types";
import { MountRoutesResult } from "../LocationContext";

let _matchedStoryboard: RuntimeStoryboard;
let _mountRoutesResults: MountRoutesResult;

export const __setMatchedStoryboard = (value: RuntimeStoryboard): void => {
  _matchedStoryboard = value;
};

export const __setMountRoutesResults = (value: MountRoutesResult): void => {
  _mountRoutesResults = value;
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

  matchStoryboard(): RuntimeStoryboard {
    return _matchedStoryboard;
  }

  mountRoutes(
    routes: RouteConf[],
    slotId: string,
    result: MountRoutesResult
  ): Promise<void> {
    Object.assign(result, _mountRoutesResults);
    return Promise.resolve();
  }

  getCurrentContext(): any {
    return {};
  }
}
