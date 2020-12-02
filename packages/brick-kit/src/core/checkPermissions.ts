import { difference } from "lodash";
import { scanPermissionActionsInStoryboard } from "@easyops/brick-utils";
import { Storyboard } from "@easyops/brick-types";
import { PermissionApi } from "@sdk/micro-app-sdk";

type PermissionStatus = "authorized" | "unauthorized" | "undefined";

const permissionMap = new Map<string, PermissionStatus>();

export async function preCheckPermissions(
  storyboard: Storyboard
): Promise<void> {
  const usedActions = scanPermissionActionsInStoryboard(storyboard);
  // Do not request known actions.
  const actions = difference(usedActions, Array.from(permissionMap.keys()));
  if (actions.length === 0) {
    return;
  }
  try {
    const result = await PermissionApi.validatePermissions({ actions });
    for (const item of result.actions) {
      permissionMap.set(item.action, item.authorizationStatus);
      if (item.authorizationStatus === "undefined") {
        // eslint-disable-next-line no-console
        console.error(`Undefined permission action: "${item.action}"`);
      }
    }
  } catch (error) {
    // Allow pre-check to fail, and
    // make it not crash when the backend service is not updated.
    // eslint-disable-next-line no-console
    console.error("Pre-check permissions failed", error);
  }
}

/**
 * Check the current logged-in user whether to have all
 * permissions of actions passed to it.
 *
 * @param actions - Required permission actions.
 */
export function checkPermissions(...actions: string[]): boolean {
  for (const action of actions) {
    // Only **exclusively authorized** permissions are ok.
    // Those scenarios below will fail:
    // - unauthorized actions (pre-check results)
    // - undefined actions (pre-check results)
    // - Un-pre-checked or pre-check failed
    switch (permissionMap.get(action)) {
      case "unauthorized":
      case "undefined":
        return false;
      case undefined:
        // eslint-disable-next-line no-console
        console.error(`Un-checked permission action: "${action}"`);
        return false;
    }
  }
  return true;
}
