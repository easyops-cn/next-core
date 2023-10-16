// istanbul ignore file
import {
  checkPermissions as _checkPermissions,
  preCheckPermissions,
  preCheckPermissionsForBrickOrRoute,
} from "./checkPermissions.js";
import { MessageDispatcher } from "./websocket/MessageDispatcher.js";
import * as authV3 from "./auth.js";
import { authV2Factory } from "./auth-v2.js";

export * as checkInstalledApps from "./checkInstalledApps.js";
export * as flowApi from "./flowApi/index.js";
export * as menu from "./menu/index.js";
export * as analytics from "./analytics/index.js";

export const checkPermissions = Object.freeze({
  checkPermissions: _checkPermissions,
  preCheckPermissions,
  preCheckPermissionsForBrickOrRoute,
});

export const messageDispatcher = new MessageDispatcher();

export const auth = authV2Factory() || authV3;
