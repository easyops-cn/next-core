import type { MicroApp, Storyboard } from "@next-core/types";
import {
  traverseStoryboardExpressions,
  collectInstalledAppsHasUsage,
  type MemberCallUsage,
} from "@next-core/utils/storyboard";
import { RuntimeApi_searchMicroAppStandalone } from "@next-api-sdk/micro-app-standalone-sdk";

type AppForCheck = Pick<MicroApp, "id" | "currentVersion" | "installStatus">;

const checkingApps = new Map<string, Promise<AppForCheck | undefined>>();
const checkedApps = new Map<string, AppForCheck | undefined>();

export function preCheckInstalledApps(
  storyboard: Storyboard,
  hasAppInBootstrap: (appId: string) => boolean
) {
  if (window.STANDALONE_MICRO_APPS && !window.NO_AUTH_GUARD) {
    const appIds = scanInstalledAppsUsage(storyboard);
    const searchIds: string[] = [];
    for (const appId of appIds) {
      // Do not check these apps already checking or in bootstrap.
      if (!checkingApps.has(appId) && !hasAppInBootstrap(appId)) {
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

export async function waitForCheckingApps(appIds: string[]) {
  await Promise.all(appIds.map((appId) => checkingApps.get(appId)));
}

export function getCheckedApp(appId: string) {
  if (window.STANDALONE_MICRO_APPS) {
    return checkedApps.get(appId);
  }
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
