import { AuthApi_checkLogin } from "@next-api-sdk/api-gateway-sdk";
import type { AuthApi_CheckLoginResponseBody } from "@next-api-sdk/api-gateway-sdk";
import { auth } from "@next-core/easyops-runtime";
import { Dialog, getHistory, getRuntime } from "@next-core/runtime";
import { i18n } from "@next-core/i18n";
import { refreshPageIfAuthenticationChanged } from "./AuthenticationChange";
import { K, NS } from "./i18n";

// check_login 契约 v1.2.0 新增的密码策略字段；
// SDK 重新生成发版前以类型交叉解耦，字段消费以契约为准。
type CheckLoginResult = AuthApi_CheckLoginResponseBody & {
  changePasswordRequired?: boolean;
  changePasswordReason?: "firstLogin" | "expired";
};

const CHANGE_PASSWORD_PAGE = "/next/account-setting/password";

let passwordChangeConfirming = false;

export async function loadCheckLogin(): Promise<void> {
  if (!window.NO_AUTH_GUARD) {
    const result = (await AuthApi_checkLogin()) as CheckLoginResult;
    if (result.loggedIn) {
      auth.authenticate(result);
      refreshPageIfAuthenticationChanged(result);
      // 密码过期/首登强制修改密码：后端字段驱动，开关与后端共用
      // check_login_password_expiration_enabled（apollo feature-switch namespace
      // 经 bootstrap 接口并入 featureFlags 下发，未配置视为关闭，与后端默认关语义一致；
      // 老版本后端时字段为 undefined，天然兼容）。
      if (
        result.changePasswordRequired &&
        getRuntime().getFeatureFlags()[
          "check_login_password_expiration_enabled"
        ] === true &&
        !passwordChangeConfirming &&
        !getHistory().location.pathname.startsWith(CHANGE_PASSWORD_PAGE)
      ) {
        redirectToChangePassword(result.changePasswordReason);
      }
    }
  }
}

function redirectToChangePassword(reason?: "firstLogin" | "expired") {
  passwordChangeConfirming = true;
  // warn 单按钮无取消路径：强制改密不允许停留在平台页面
  Dialog.show({
    type: "warn",
    content: i18n.t(
      reason === "firstLogin"
        ? `${NS}:${K.FORCE_CHANGE_PASSWORD_FOR_FIRST_LOGIN}`
        : `${NS}:${K.FORCE_CHANGE_PASSWORD_FOR_EXPIRED}`
    ),
  }).then(() => {
    passwordChangeConfirming = false;
    getHistory().push(CHANGE_PASSWORD_PAGE);
  });
}
