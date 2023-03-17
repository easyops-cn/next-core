import { http, HttpOptions } from "@next-core/http";
import { ResponseBodyWrapper } from "../../../wrapper.js";

export interface PermissionApi_ValidatePermissionsRequestBody {
  /** 权限点action列表 */
  actions?: string[];
}

export interface PermissionApi_ValidatePermissionsResponseBody {
  /** 权限点列表 */
  actions?: PermissionApi_ValidatePermissionsResponseBody_actions_item[];
}

/**
 * @description 校验系统权限
 * @endpoint POST /api/micro_app/v1/permission/validate
 */
export const PermissionApi_validatePermissions = async (
  data: PermissionApi_ValidatePermissionsRequestBody,
  options?: HttpOptions
): Promise<PermissionApi_ValidatePermissionsResponseBody> =>
  /**! @contract easyops.api.micro_app.permission.ValidatePermissions@1.0.0 */ (
    await http.post<
      ResponseBodyWrapper<PermissionApi_ValidatePermissionsResponseBody>
    >(
      "api/gateway/micro_app.permission.ValidatePermissions/api/micro_app/v1/permission/validate",
      data,
      options
    )
  ).data;

export interface PermissionApi_ValidatePermissionsResponseBody_actions_item {
  /** action */
  action?: string;

  /** 授权状态 */
  authorizationStatus?: "authorized" | "unauthorized" | "undefined";
}
