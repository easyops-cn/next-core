import { authenticate, getAuth, logout } from "./auth";
import { resetPermissionPreChecks } from "./core/checkPermissions";

jest.mock("./core/checkPermissions");

describe("auth", () => {
  it("should work", () => {
    expect(getAuth()).toEqual({});
    authenticate({
      org: 8888,
      username: "mock-user",
      userInstanceId: "abc",
    });
    expect(getAuth()).toEqual({
      org: 8888,
      username: "mock-user",
      userInstanceId: "abc",
    });

    expect(resetPermissionPreChecks).not.toBeCalled();
    logout();
    expect(getAuth()).toEqual({});
    expect(resetPermissionPreChecks).toBeCalled();
  });
});
