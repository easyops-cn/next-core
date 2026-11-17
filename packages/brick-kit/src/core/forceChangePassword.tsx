import React from "react";
import type { AuthApi_CheckLoginResponseBody } from "@next-sdk/api-gateway-sdk";
import i18next from "i18next";
import { Modal } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import { getRuntime } from "../runtime";
import { getHistory } from "../history";
import { K, NS_BRICK_KIT } from "../i18n/constants";

// check_login 契约 v1.2.0 新增的密码策略字段；
// SDK 重新生成发版前以类型交叉解耦，字段消费以契约为准。
export type CheckLoginResult = AuthApi_CheckLoginResponseBody & {
  changePasswordRequired?: boolean;
  changePasswordReason?: "firstLogin" | "expired";
};

// history 内部路径不含部署前缀（basename，一般为 /next/）：
// 浏览器地址 /next/account-setting/password 对应 history 路径 /account-setting/password。
const CHANGE_PASSWORD_PAGE = "/account-setting/password";

let passwordChangeConfirming = false;

/**
 * 强制改密检查。须在 `loadMicroApps` 完成、bootstrapData 就绪后调用
 * （featureFlags 读自 bootstrapData，过早读取恒为空）。
 */
export function checkForceChangePassword(
  auth: CheckLoginResult | undefined
): void {
  // 密码过期/首登强制修改密码：后端字段驱动，开关与后端共用
  // check_login_password_expiration_enabled（apollo feature-switch namespace
  // 经 bootstrap 接口并入 featureFlags 下发，未配置视为关闭，与后端默认关语义一致）。
  if (
    auth?.loggedIn &&
    auth.changePasswordRequired &&
    getRuntime().getFeatureFlags()[
      "check_login_password_expiration_enabled"
    ] === true &&
    !passwordChangeConfirming &&
    !getHistory().location.pathname.startsWith(CHANGE_PASSWORD_PAGE)
  ) {
    redirectToChangePassword(auth.changePasswordReason);
  }
}

function redirectToChangePassword(reason?: "firstLogin" | "expired") {
  passwordChangeConfirming = true;
  // 警告弹窗无取消路径：强制改密不允许停留在平台页面
  Modal.warning({
    icon: <ExclamationCircleOutlined />,
    content: i18next.t(
      reason === "firstLogin"
        ? `${NS_BRICK_KIT}:${K.FORCE_CHANGE_PASSWORD_FOR_FIRST_LOGIN}`
        : `${NS_BRICK_KIT}:${K.FORCE_CHANGE_PASSWORD_FOR_EXPIRED}`
    ),
    okText: i18next.t(`${NS_BRICK_KIT}:${K.MODAL_OK}`),
    keyboard: false,
    onOk: () => {
      passwordChangeConfirming = false;
      getHistory().push(CHANGE_PASSWORD_PAGE);
    },
  });
}
