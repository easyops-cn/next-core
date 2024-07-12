import { difference } from "lodash";
import {
  scanPermissionActionsInAny,
  scanPermissionActionsInStoryboard,
} from "@next-core/utils/storyboard";
import type { BrickConf, RouteConf, Storyboard } from "@next-core/types";
import { PermissionApi_validatePermissions } from "@next-api-sdk/micro-app-sdk";
import { getAuth, isLoggedIn } from "./auth.js";

type PermissionStatus = "authorized" | "unauthorized" | "undefined";

const checkedPermissions: string[] = [];
const permissionMap = new Map<string, PermissionStatus>();
let isPermissionPreChecksLoaded = false;

export function preCheckPermissions(
  storyboard: Storyboard
): Promise<void> | undefined {
  if (isLoggedIn() && !getAuth().isAdmin) {
    const usedActions = scanPermissionActionsInStoryboard(storyboard);
    return validatePermissions(usedActions);
  }
}

export async function preCheckPermissionsForBrickOrRoute(
  container: BrickConf | RouteConf,
  asyncComputeRealValue: (value: unknown) => Promise<unknown>
) {
  if (
    isLoggedIn() &&
    !getAuth().isAdmin &&
    Array.isArray(container.permissionsPreCheck)
  ) {
    const actions = (await asyncComputeRealValue(
      container.permissionsPreCheck
    )) as string[];
    return validatePermissions(actions);
  }
}

export function preCheckPermissionsForAny(
  data: unknown
): Promise<void> | undefined {
  if (isLoggedIn() && !getAuth().isAdmin) {
    const usedActions = scanPermissionActionsInAny(data);
    return validatePermissions(usedActions);
  }
}

export async function validatePermissions(
  usedActions: string[]
): Promise<void> {
  // Do not request known actions.
  const actions = difference(usedActions, [...checkedPermissions]);
  if (actions.length === 0) {
    return;
  }
  checkedPermissions.push(...actions);
  try {
    const result = await PermissionApi_validatePermissions(
      { actions },
      { noAbortOnRouteChange: true }
    );
    for (const item of result.actions!) {
      permissionMap.set(item.action!, item.authorizationStatus!);
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
  } finally {
    isPermissionPreChecksLoaded = true;
  }
}

/**
 * Check the current logged-in user whether to have all
 * permissions of actions passed to it.
 *
 * @param actions - Required permission actions.
 */
export function checkPermissions(...actions: string[]): boolean {
  if (!isLoggedIn()) {
    return false;
  }

  if (getAuth().isAdmin) {
    return true;
  }

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
        console.error(
          `Un-checked permission action: "${action}", please make sure the permission to check is defined in permissionsPreCheck.`
        );
        return false;
    }
  }
  return true;
}

/**
 * Check permission pre-checks is loaded.
 */
export function checkPermissionPreChecksLoaded(): boolean {
  return isPermissionPreChecksLoaded;
}

/**
 * Reset permission pre-checks after logged-out.
 */
export function resetPermissionPreChecks(): void {
  checkedPermissions.length = 0;
  permissionMap.clear();
  isPermissionPreChecksLoaded = false;
}
