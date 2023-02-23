import { http, HttpOptions } from "@next-core/http";
import { ResponseBodyWrapper } from "../../../wrapper.js";

export interface OrgApi_SaaSOrgRegisterRequestBody {
  /** 用户名 */
  username?: string;

  /** 邮箱字符串 */
  email?: string;

  /** 密码 */
  password?: string;

  /** 手机号码 */
  phone?: string;

  /** 验证码 */
  verification_code?: string;

  /** 验证码消息 ID */
  message_id?: string;
}

export interface OrgApi_SaaSOrgRegisterResponseBody {
  /** 是否已经登录 */
  loggedIn?: boolean;

  /** 用户名 */
  username?: string;

  /** 客户id */
  org?: number;

  /** 用户地理位置 */
  location?: string;

  /** 用户 id */
  userInstanceId?: string;

  /** 用户来源 */
  loginFrom?: string;

  /** 访问规则(例如按照平台区分 cmdb,ops) */
  accessRule?: string;

  /** 判断当前登录用户是否是系统管理员 */
  isAdmin?: boolean;
}

/**
 * @description saas注册org
 * @endpoint POST /api/org/saas-org-register
 */
export const OrgApi_saaSOrgRegister = async (
  data: OrgApi_SaaSOrgRegisterRequestBody,
  options?: HttpOptions
): Promise<OrgApi_SaaSOrgRegisterResponseBody> =>
  /**! @contract easyops.api.api_gateway.org.SaaSOrgRegister@1.1.0 */ (
    await http.post<ResponseBodyWrapper<OrgApi_SaaSOrgRegisterResponseBody>>(
      "api/org/saas-org-register",
      data,
      options
    )
  ).data;
