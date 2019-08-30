import { RuntimeStoryboard } from "@easyops/brick-types";
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
  matchStoryboard(): RuntimeStoryboard {
    return _matchedStoryboard;
  }

  mountRoutes(): MountRoutesResult {
    return _mountRoutesResults;
  }
}
