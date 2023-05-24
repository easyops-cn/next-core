import type { MicroApp } from "@next-core/types";
import { type CompareOperator, compare } from "compare-versions";
import { _internalApiGetAppInBootstrapData, hooks } from "./Runtime.js";

export type AppForCheck = Pick<
  MicroApp,
  "id" | "currentVersion" | "installStatus"
>;

export function hasInstalledApp(appId: string, matchVersion?: string): boolean {
  // First, check whether the app is in bootstrap already.
  let app = _internalApiGetAppInBootstrapData(appId) as AppForCheck | undefined;
  if (!app && hooks?.checkInstalledApps) {
    app = hooks.checkInstalledApps.getCheckedApp(appId);
  }
  if (!app || app.installStatus === "running") {
    return false;
  }
  // Todo: `currentVersion` maybe `""`
  if (!matchVersion || !app.currentVersion) {
    return true;
  }
  // Valid `matchVersion`:
  //   >=1.2.3
  //   >1.2.3
  //   =1.2.3
  //   <=1.2.3
  //   <1.2.3
  const matches = matchVersion.match(/^([><]=?|=)(.*)$/);
  try {
    if (!matches) {
      throw new TypeError(`Invalid match version: ${matchVersion}`);
    }
    return compare(
      app.currentVersion,
      matches[2],
      matches[1] as CompareOperator
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
  }
  return false;
}
