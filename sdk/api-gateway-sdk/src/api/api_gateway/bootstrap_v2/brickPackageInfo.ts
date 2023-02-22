import { http, HttpOptions } from "@next-core/http";
import { ResponseBodyWrapper } from "../../../wrapper.js";

export interface BootstrapV2Api_BrickPackageInfoResponseBody {
  /** 所有bricks的id，包括custom-templates和契约生成的providers，不包括自定义providers */
  bricks?: string[];

  /** 所有legacy-templates的id（不是custom-templates） */
  templates?: string[];

  /** 所有providers的id（包括自定义providers和契约生成的providers） */
  providers?: string[];

  /** 所有processors的id */
  processors?: string[];
}

/**
 * @description 获取构件包信息 (包括brick、templates、providers、processors（从bootstrap中分离出来）)
 * @endpoint GET /api/auth/brick_package_info
 */
export const BootstrapV2Api_brickPackageInfo = async (
  options?: HttpOptions
): Promise<BootstrapV2Api_BrickPackageInfoResponseBody> =>
  /**! @contract easyops.api.api_gateway.bootstrap_v2.BrickPackageInfo@1.0.0 */ (
    await http.get<
      ResponseBodyWrapper<BootstrapV2Api_BrickPackageInfoResponseBody>
    >("api/auth/brick_package_info", options)
  ).data;
