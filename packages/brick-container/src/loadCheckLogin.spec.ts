import { describe, test, expect, beforeEach } from "@jest/globals";
import { AuthApi_checkLogin } from "@next-api-sdk/api-gateway-sdk";
import { auth } from "@next-core/easyops-runtime";
import { Dialog } from "@next-core/runtime";
import { loadCheckLogin } from "./loadCheckLogin.js";

type CheckLoginResponseBody = Awaited<ReturnType<typeof AuthApi_checkLogin>>;

const mockFeatureFlags: Record<string, unknown> = {};
const mockPush = jest.fn();
const mockHistory = {
  location: { pathname: "/" },
  push: mockPush,
};

jest.mock("@next-api-sdk/api-gateway-sdk");
jest.mock("@next-core/easyops-runtime", () => ({
  auth: {
    authenticate: jest.fn(),
  },
}));
jest.mock("@next-core/i18n", () => ({
  i18n: {
    t: jest.fn((key: string) => key),
  },
}));
jest.mock("@next-core/runtime", () => ({
  Dialog: {
    show: jest.fn(() => Promise.resolve()),
  },
  getRuntime() {
    return {
      getFeatureFlags() {
        return mockFeatureFlags;
      },
    };
  },
  getHistory() {
    return mockHistory;
  },
}));

const mockCheckLogin = AuthApi_checkLogin as jest.MockedFunction<
  typeof AuthApi_checkLogin
>;
const mockDialogShow = Dialog.show as jest.Mock;

async function flushPromises() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("loadCheckLogin", () => {
  beforeEach(async () => {
    mockCheckLogin.mockReset();
    mockDialogShow.mockReset();
    mockDialogShow.mockImplementation(() => Promise.resolve());
    mockPush.mockReset();
    delete mockFeatureFlags["check_login_password_expiration_enabled"];
    mockHistory.location.pathname = "/";
    // 清空上一个用例遗留的提示弹窗状态（passwordChangeConfirming 模块级标志）
    await flushPromises();
  });

  test("should work for when not logged in", async () => {
    mockCheckLogin.mockResolvedValueOnce({
      loggedIn: false,
    } as CheckLoginResponseBody);
    await loadCheckLogin();
    expect(auth.authenticate).not.toHaveBeenCalled();
    expect(mockDialogShow).not.toHaveBeenCalled();
  });

  test("should work for when logged in", async () => {
    mockCheckLogin.mockResolvedValueOnce({
      loggedIn: true,
    } as CheckLoginResponseBody);
    await loadCheckLogin();
    // authenticate 的入参类型为 Omit<响应, "loggedIn">，断言仅校验透传结果
    expect(auth.authenticate).toHaveBeenCalledWith({
      loggedIn: true,
    } as unknown as Parameters<typeof auth.authenticate>[0]);
  });

  test("should work for no auth guard", async () => {
    window.NO_AUTH_GUARD = true;
    await loadCheckLogin();
    expect(mockCheckLogin).not.toHaveBeenCalled();
    expect(auth.authenticate).not.toHaveBeenCalled();
    window.NO_AUTH_GUARD = false;
  });

  test("should force redirect when password expired", async () => {
    mockFeatureFlags["check_login_password_expiration_enabled"] = true;
    mockCheckLogin.mockResolvedValueOnce({
      loggedIn: true,
      changePasswordRequired: true,
      changePasswordReason: "expired",
    } as CheckLoginResponseBody);
    await loadCheckLogin();

    expect(mockDialogShow).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "warn",
        content: "-/container:FORCE_CHANGE_PASSWORD_FOR_EXPIRED",
      })
    );
    await flushPromises();
    expect(mockPush).toHaveBeenCalledWith("/next/account-setting/password");
  });

  test("should force redirect on first login", async () => {
    mockFeatureFlags["check_login_password_expiration_enabled"] = true;
    mockCheckLogin.mockResolvedValueOnce({
      loggedIn: true,
      changePasswordRequired: true,
      changePasswordReason: "firstLogin",
    } as CheckLoginResponseBody);
    await loadCheckLogin();

    expect(mockDialogShow).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "warn",
        content: "-/container:FORCE_CHANGE_PASSWORD_FOR_FIRST_LOGIN",
      })
    );
  });

  test("should not redirect when changePasswordRequired is falsy", async () => {
    mockCheckLogin.mockResolvedValueOnce({
      loggedIn: true,
      changePasswordRequired: false,
    } as CheckLoginResponseBody);
    await loadCheckLogin();

    expect(mockDialogShow).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  test("should not redirect when the feature flag is not configured", async () => {
    // 共用后端开关：未配置（undefined）视为关闭，与后端默认关语义一致
    mockCheckLogin.mockResolvedValueOnce({
      loggedIn: true,
      changePasswordRequired: true,
      changePasswordReason: "expired",
    } as CheckLoginResponseBody);
    await loadCheckLogin();

    expect(mockDialogShow).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  test("should not redirect when feature flag is false", async () => {
    mockFeatureFlags["check_login_password_expiration_enabled"] = false;
    mockCheckLogin.mockResolvedValueOnce({
      loggedIn: true,
      changePasswordRequired: true,
      changePasswordReason: "expired",
    } as CheckLoginResponseBody);
    await loadCheckLogin();

    expect(mockDialogShow).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  test("should not redirect when already on the change password page", async () => {
    mockHistory.location.pathname = "/next/account-setting/password";
    mockCheckLogin.mockResolvedValueOnce({
      loggedIn: true,
      changePasswordRequired: true,
      changePasswordReason: "expired",
    } as CheckLoginResponseBody);
    await loadCheckLogin();

    expect(mockDialogShow).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  test("should not show duplicate dialogs while confirming", async () => {
    mockFeatureFlags["check_login_password_expiration_enabled"] = true;
    let resolveDialog!: () => void;
    mockDialogShow.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveDialog = () => resolve(undefined);
        })
    );
    mockCheckLogin.mockResolvedValueOnce({
      loggedIn: true,
      changePasswordRequired: true,
      changePasswordReason: "expired",
    } as CheckLoginResponseBody);
    await loadCheckLogin();
    expect(mockDialogShow).toHaveBeenCalledTimes(1);

    // 确认弹窗挂起期间，不重复弹窗
    mockCheckLogin.mockResolvedValueOnce({
      loggedIn: true,
      changePasswordRequired: true,
      changePasswordReason: "expired",
    } as CheckLoginResponseBody);
    await loadCheckLogin();
    expect(mockDialogShow).toHaveBeenCalledTimes(1);

    // 弹窗确认后标志复位，后续整页加载可以再次提示
    resolveDialog();
    await flushPromises();
    mockCheckLogin.mockResolvedValueOnce({
      loggedIn: true,
      changePasswordRequired: true,
      changePasswordReason: "expired",
    } as CheckLoginResponseBody);
    await loadCheckLogin();
    expect(mockDialogShow).toHaveBeenCalledTimes(2);
    await flushPromises();
    expect(mockPush).toHaveBeenCalledTimes(2);
  });
});
