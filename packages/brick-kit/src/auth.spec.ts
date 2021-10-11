import { authenticate, getAuth, logout } from "./auth";
import { resetPermissionPreChecks } from "./internal/checkPermissions";

jest.mock("./internal/checkPermissions");

describe("auth", () => {
  it("should work", () => {
    expect(getAuth()).toEqual({});
    authenticate({
      org: 8888,
      username: "mock-user",
      userInstanceId: "abc",
      accessRule: "cmdb",
    });
    expect(getAuth()).toEqual({
      org: 8888,
      username: "mock-user",
      userInstanceId: "abc",
      accessRule: "cmdb",
    });

    expect(resetPermissionPreChecks).not.toBeCalled();
    logout();
    expect(getAuth()).toEqual({});
    expect(resetPermissionPreChecks).toBeCalled();
  });
});
