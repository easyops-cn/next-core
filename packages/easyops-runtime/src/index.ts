// istanbul ignore file
import {
  checkPermissions as _checkPermissions,
  preCheckPermissions,
  preCheckPermissionsForBrickOrRoute,
} from "./checkPermissions.js";

export * as checkInstalledApps from "./checkInstalledApps.js";
export * as flowApi from "./flowApi/index.js";
export * as auth from "./auth.js";
export * as menu from "./menu/index.js";

export const checkPermissions = Object.freeze({
  checkPermissions: _checkPermissions,
  preCheckPermissions,
  preCheckPermissionsForBrickOrRoute,
});
