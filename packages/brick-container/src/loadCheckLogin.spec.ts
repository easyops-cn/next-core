import { describe, test, expect } from "@jest/globals";
import { AuthApi_checkLogin } from "@next-api-sdk/api-gateway-sdk";
import { auth } from "@next-core/easyops-runtime";
import { loadCheckLogin } from "./loadCheckLogin.js";

jest.mock("@next-api-sdk/api-gateway-sdk");
jest.mock("@next-core/easyops-runtime");

const mockCheckLogin = AuthApi_checkLogin as jest.MockedFunction<
  typeof AuthApi_checkLogin
>;

describe("loadCheckLogin", () => {
  test("should work for when not logged in", async () => {
    mockCheckLogin.mockResolvedValueOnce({ loggedIn: false });
    await loadCheckLogin();
    expect(auth.authenticate).not.toBeCalled();
  });

  test("should work for when logged in", async () => {
    mockCheckLogin.mockResolvedValueOnce({ loggedIn: true });
    await loadCheckLogin();
    expect(auth.authenticate).toBeCalledWith({
      loggedIn: true,
    });
  });

  test("should work for no auth guard", async () => {
    window.NO_AUTH_GUARD = true;
    await loadCheckLogin();
    expect(mockCheckLogin).not.toBeCalled();
    expect(auth.authenticate).not.toBeCalled();
    window.NO_AUTH_GUARD = false;
  });
});
