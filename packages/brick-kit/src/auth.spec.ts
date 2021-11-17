import { userAnalytics } from "@next-core/easyops-analytics";
import { authenticate, getAuth, logout } from "./auth";
import { resetPermissionPreChecks } from "./internal/checkPermissions";

jest.spyOn(userAnalytics, "initialized", "get").mockReturnValue(true);
jest.mock("./internal/checkPermissions");

const spyOnSetUserId = jest.spyOn(userAnalytics, "setUserId");

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
    expect(spyOnSetUserId).toBeCalledWith("abc");

    expect(resetPermissionPreChecks).not.toBeCalled();
    logout();
    expect(getAuth()).toEqual({});
    expect(resetPermissionPreChecks).toBeCalled();
    expect(spyOnSetUserId).toBeCalledWith();
  });
});
