import { describe, test, expect, beforeEach } from "@jest/globals";
import { Modal } from "antd";
import { checkForceChangePassword } from "./forceChangePassword";
import type { CheckLoginResult } from "./forceChangePassword";

const mockFeatureFlags: Record<string, unknown> = {};
const mockPush = jest.fn();
const mockHistory = {
  location: { pathname: "/" },
  push: mockPush,
};

jest.mock("../runtime", () => ({
  getRuntime() {
    return {
      getFeatureFlags() {
        return mockFeatureFlags;
      },
    };
  },
}));
jest.mock("../history", () => ({
  getHistory() {
    return mockHistory;
  },
}));

let mockModalWarning: jest.SpyInstance;

function makeAuth(extra?: Partial<CheckLoginResult>): CheckLoginResult {
  return {
    loggedIn: true,
    changePasswordRequired: true,
    changePasswordReason: "expired",
    ...extra,
  } as CheckLoginResult;
}

describe("checkForceChangePassword", () => {
  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const antd = require("antd");
    mockModalWarning = jest
      .spyOn(antd.Modal, "warning")
      .mockImplementation(() => undefined);
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const i18nextModule = require("i18next");
    jest
      .spyOn(i18nextModule.default ?? i18nextModule, "t")
      .mockImplementation((key: unknown) => key as string);
    jest.clearAllMocks();
    mockPush.mockReset();
    delete mockFeatureFlags["check_login_password_expiration_enabled"];
    mockHistory.location.pathname = "/";
  });

  test("should warn and redirect when password expired", () => {
    mockFeatureFlags["check_login_password_expiration_enabled"] = true;
    checkForceChangePassword(makeAuth({ changePasswordReason: "expired" }));

    expect(mockModalWarning).toHaveBeenCalledTimes(1);
    const options = mockModalWarning.mock.calls[0][0];
    expect(options.content).toBe("brick-kit:FORCE_CHANGE_PASSWORD_FOR_EXPIRED");
    expect(options.keyboard).toBe(false);

    options.onOk();
    expect(mockPush).toHaveBeenCalledWith("/account-setting/password");
  });

  test("should warn and redirect on first login", () => {
    mockFeatureFlags["check_login_password_expiration_enabled"] = true;
    checkForceChangePassword(makeAuth({ changePasswordReason: "firstLogin" }));

    expect(mockModalWarning).toHaveBeenCalledTimes(1);
    expect(mockModalWarning.mock.calls[0][0].content).toBe(
      "brick-kit:FORCE_CHANGE_PASSWORD_FOR_FIRST_LOGIN"
    );
    // 闭合弹窗生命周期，复位模块级 confirming 标志
    mockModalWarning.mock.calls[0][0].onOk();
  });

  test("should do nothing for an undefined auth", () => {
    mockFeatureFlags["check_login_password_expiration_enabled"] = true;
    checkForceChangePassword(undefined);

    expect(mockModalWarning).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  test("should not redirect when changePasswordRequired is falsy", () => {
    // 显式开启开关，使负向断言隔离验证 changePasswordRequired 条件
    mockFeatureFlags["check_login_password_expiration_enabled"] = true;
    checkForceChangePassword(makeAuth({ changePasswordRequired: false }));

    expect(mockModalWarning).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  test("should not redirect when the feature flag is not configured", () => {
    // 共用后端开关：未配置（undefined）视为关闭，与后端默认关语义一致
    checkForceChangePassword(makeAuth());

    expect(mockModalWarning).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  test("should not redirect when feature flag is false", () => {
    mockFeatureFlags["check_login_password_expiration_enabled"] = false;
    checkForceChangePassword(makeAuth());

    expect(mockModalWarning).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  test("should not redirect when already on the change password page", () => {
    // history 内部路径不含部署前缀（basename）
    mockHistory.location.pathname = "/account-setting/password";
    mockFeatureFlags["check_login_password_expiration_enabled"] = true;
    checkForceChangePassword(makeAuth());

    expect(mockModalWarning).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  test("should not show duplicate modals while confirming", () => {
    mockFeatureFlags["check_login_password_expiration_enabled"] = true;
    const auth = makeAuth();

    checkForceChangePassword(auth);
    expect(mockModalWarning).toHaveBeenCalledTimes(1);

    // 弹窗挂起期间，不重复弹窗
    checkForceChangePassword(auth);
    expect(mockModalWarning).toHaveBeenCalledTimes(1);

    // 弹窗确认后标志复位，后续检查可以再次提示
    mockModalWarning.mock.calls[0][0].onOk();
    checkForceChangePassword(auth);
    expect(mockModalWarning).toHaveBeenCalledTimes(2);
    expect(mockPush).toHaveBeenCalledTimes(1);
  });
});
