import type { MicroApp, Storyboard } from "@next-core/types";
import { traverseStoryboardExpressions } from "@next-core/utils/storyboard";
import { RuntimeApi_searchMicroAppStandalone } from "@next-api-sdk/micro-app-standalone-sdk";
import { type CompareOperator, compare } from "compare-versions";
import {
  MemberCallUsage,
  collectInstalledAppsHasUsage,
} from "./compute/collectMemberCallUsage.js";
import { _internalApiGetAppInBootstrapData } from "./Runtime.js";

type AppForCheck = Pick<MicroApp, "id" | "currentVersion" | "installStatus">;

const checkingApps = new Map<string, Promise<AppForCheck | undefined>>();
const checkedApps = new Map<string, AppForCheck | undefined>();

export function preCheckInstalledApps(storyboard: Storyboard) {
  if (window.STANDALONE_MICRO_APPS && !window.NO_AUTH_GUARD) {
    const appIds = scanInstalledAppsUsage(storyboard);
    const searchIds: string[] = [];
    for (const appId of appIds) {
      // Do not check these apps already checking or in bootstrap.
      if (
        !checkingApps.has(appId) &&
        !_internalApiGetAppInBootstrapData(appId)
      ) {
        searchIds.push(appId);
      }
    }
    if (searchIds.length === 0) {
      return;
    }
    const promise = RuntimeApi_searchMicroAppStandalone({
      query: { appId: { $in: searchIds } },
      fields: ["appId", "currentVersion", "installStatus"],
    }).catch((error) => {
      // Allow search micro app to fail, and
      // make it not crash when the backend service is not updated.
      // eslint-disable-next-line no-console
      console.error("Get off site standalone micro-apps failed", error);
    });
    for (const appId of searchIds) {
      checkingApps.set(
        appId,
        promise.then((result) => {
          const app = result?.list?.find((item) => item.appId === appId);
          const checkedApp = app
            ? {
                ...app,
                id: appId,
              }
            : undefined;
          checkedApps.set(appId, checkedApp);
          return checkedApp;
        })
      );
    }
  }
}

export function waitForCheckingApps(appIds: string[]) {
  return Promise.all(appIds.map((appId) => checkingApps.get(appId)));
}

export function hasInstalledApp(appId: string, matchVersion?: string): boolean {
  // First, check whether the app is in bootstrap already.
  let app = _internalApiGetAppInBootstrapData(appId) as AppForCheck | undefined;
  if (!app && window.STANDALONE_MICRO_APPS) {
    app = checkedApps.get(appId);
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

function scanInstalledAppsUsage(storyboard: Storyboard) {
  const usage: MemberCallUsage = {
    usedArgs: new Set(),
  };
  // `INSTALLED_APPS.has(...)` is not available in storyboard functions
  const { customTemplates, menus } = storyboard.meta ?? {};
  traverseStoryboardExpressions(
    [storyboard.routes, customTemplates, menus],
    (node, parent) => {
      collectInstalledAppsHasUsage(usage, node, parent);
    },
    "INSTALLED_APPS"
  );
  return [...usage.usedArgs];
}
