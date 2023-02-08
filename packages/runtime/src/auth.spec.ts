// import { userAnalytics } from "@next-core/easyops-analytics";
import { authenticate, getAuth, logout, isLoggedIn } from "./auth.js";
import { resetPermissionPreChecks } from "./internal/checkPermissions.js";

// jest.spyOn(userAnalytics, "initialized", "get").mockReturnValue(true);
jest.mock("./internal/checkPermissions");

// const spyOnSetUserId = jest.spyOn(userAnalytics, "setUserId");

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
    // expect(spyOnSetUserId).toBeCalledWith("abc");

    expect(resetPermissionPreChecks).not.toBeCalled();
    logout();
    expect(getAuth()).toEqual({});
    expect(resetPermissionPreChecks).toBeCalled();
    // expect(spyOnSetUserId).toBeCalledWith();
  });
});
