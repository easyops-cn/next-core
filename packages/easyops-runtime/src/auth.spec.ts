import { authenticate, getAuth, logout, isLoggedIn } from "./auth.js";
// import { resetPermissionPreChecks } from "./internal/checkPermissions.js";

// jest.mock("./internal/checkPermissions");

describe("auth", () => {
  it("should work", () => {
    expect(getAuth()).toEqual({});
    expect(isLoggedIn()).toEqual(false);
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
    expect(isLoggedIn()).toEqual(true);

    // expect(resetPermissionPreChecks).not.toBeCalled();
    logout();
    expect(getAuth()).toEqual({});
    // expect(resetPermissionPreChecks).toBeCalled();
  });
});
