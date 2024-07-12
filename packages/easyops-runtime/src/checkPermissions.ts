import {
  scanPermissionActionsInAny,
  scanPermissionActionsInStoryboard,
} from "@next-core/utils/storyboard";
import type { BrickConf, RouteConf, Storyboard } from "@next-core/types";
import { PermissionApi_validatePermissions } from "@next-api-sdk/micro-app-sdk";
import { getAuth, isLoggedIn } from "./auth.js";

type PermissionStatus = "authorized" | "unauthorized" | "undefined";

const checkingPermissions = new Map<string, Promise<void>>();
const checkedPermissions: string[] = [];
const permissionMap = new Map<string, PermissionStatus>();

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
  const uncheckedActions = usedActions.filter(
    (action) => !checkedPermissions.includes(action)
  );
  if (uncheckedActions.length === 0) {
    return;
  }
  const checkingTasks: Promise<void>[] = [];
  const restActions: string[] = [];
  for (const action of uncheckedActions) {
    const promise = checkingPermissions.get(action);
    if (promise) {
      checkingTasks.push(promise);
    } else {
      restActions.push(action);
    }
  }
  if (restActions.length > 0) {
    const task = (async () => {
      try {
        const result = await PermissionApi_validatePermissions(
          { actions: restActions },
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
        checkedPermissions.push(...restActions);
      }
    })();
    for (const action of restActions) {
      checkingPermissions.set(action, task);
    }
    checkingTasks.push(task);
  }
  await Promise.all(checkingTasks);
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
 * Reset permission pre-checks after logged-out.
 */
export function resetPermissionPreChecks(): void {
  checkingPermissions.clear();
  checkedPermissions.length = 0;
  permissionMap.clear();
}
