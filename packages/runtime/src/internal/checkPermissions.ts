import { difference } from "lodash";
import { scanPermissionActionsInStoryboard } from "@next-core/utils/storyboard";
import { Storyboard } from "@next-core/brick-types";
// import { PermissionApi_validatePermissions } from "@next-sdk/micro-app-sdk";
// import { getAuth } from "../auth";

const PermissionApi_validatePermissions = async function ({
  actions,
}: {
  actions: string[];
}) {
  await new Promise((resolve) => {
    setTimeout(resolve, Math.random() * 100);
  });
  // eslint-disable-next-line no-console
  console.log(
    "called PermissionApi_validatePermissions with actions:",
    actions
  );
  return {
    actions: actions.map((action) => ({
      action,
      authorizationStatus: "authorized" as PermissionStatus,
    })),
  };
};

type PermissionStatus = "authorized" | "unauthorized" | "undefined";

const checkedPermissions: string[] = [];
const permissionMap = new Map<string, PermissionStatus>();

export function preCheckPermissions(storyboard: Storyboard): Promise<void> {
  // if (getAuth().isAdmin) {
  //   return;
  // }
  const usedActions = scanPermissionActionsInStoryboard(storyboard);
  return validatePermissions(usedActions);
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
    const result = await PermissionApi_validatePermissions({ actions });
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
  // if (getAuth().isAdmin) {
  //   return true;
  // }

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
  checkedPermissions.length = 0;
  permissionMap.clear();
}
