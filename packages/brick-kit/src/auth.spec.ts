import { userAnalytics } from "@next-core/easyops-analytics";
import { authenticate, getAuth, logout } from "./auth";
import { initAnalytics } from "./core/initAnalytics";
import { resetPermissionPreChecks } from "./internal/checkPermissions";

jest.spyOn(userAnalytics, "initialized", "get").mockReturnValue(true);
jest.mock("./core/initAnalytics");
jest.mock("./internal/checkPermissions");

const mockInitAnalytics = initAnalytics as jest.Mock;

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
    expect(mockInitAnalytics).toBeCalled();

    expect(resetPermissionPreChecks).not.toBeCalled();
    logout();
    expect(getAuth()).toEqual({});
    expect(resetPermissionPreChecks).toBeCalled();
    expect(mockInitAnalytics).toBeCalled();
  });
});
