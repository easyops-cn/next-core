import { difference } from "lodash";
import { scanInstalledAppsInStoryboard } from "@next-core/brick-utils";
import { Storyboard } from "@next-core/brick-types";
import { RuntimeApi_searchMicroAppStandalone } from "@next-sdk/micro-app-standalone-sdk";
import { MicroApp } from "@next-core/brick-types";

const standaloneApps: Partial<MicroApp>[] = [];
const appIdSet = new Set<string>();

export async function preFetchStandaloneInstalledApps(
  storyboard: Storyboard
): Promise<void> {
  const saIds = scanInstalledAppsInStoryboard(storyboard);
  await fetchStandaloneApps(saIds);
}

export async function fetchStandaloneApps(saIds: string[]): Promise<void> {
  // ignore apps which are already searched
  const searchIds = difference(saIds, Array.from(appIdSet));
  if (searchIds.length === 0) {
    return;
  }
  try {
    const result = await RuntimeApi_searchMicroAppStandalone({
      query: { isActiveVersion: true, appId: { $in: searchIds } },
      fields: ["appId", "version"],
    });
    for (const item of result.list) {
      standaloneApps.push({
        id: item.appId,
        currentVersion: item.version,
        installStatus: "ok",
      });
    }
    for (const id of searchIds) {
      appIdSet.add(id);
    }
  } catch (error) {
    // Allow search micro app to fail, and
    // make it not crash when the backend service is not updated.
    // eslint-disable-next-line no-console
    console.error("get off site standalone micro app failed", error);
  }
}

export function getStandaloneInstalledApps(): Partial<MicroApp>[] {
  return standaloneApps;
}
