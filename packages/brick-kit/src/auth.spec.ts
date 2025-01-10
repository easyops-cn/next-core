import { userAnalytics } from "@next-core/easyops-analytics";
import {
  authenticate,
  getAuth,
  logout,
  isLoggedIn,
  isBlockedPath,
  isBlockedHref,
  isBlockedUrl,
} from "./auth";
import { resetPermissionPreChecks } from "./internal/checkPermissions";

jest.spyOn(userAnalytics, "initialized", "get").mockReturnValue(true);
jest.mock("./internal/checkPermissions");

const spyOnSetUserId = jest.spyOn(userAnalytics, "setUserId");

describe("auth", () => {
  const base = document.createElement("base");
  beforeAll(() => {
    base.setAttribute("href", "/next/");
    document.head.appendChild(base);
  });
  afterAll(() => {
    document.head.removeChild(base);
  });

  it("should work", () => {
    expect(getAuth()).toEqual({});
    expect(isLoggedIn()).toEqual(false);
    authenticate({
      org: 8888,
      username: "mock-user",
      userInstanceId: "abc",
      accessRule: "cmdb",
      license: {
        blackList: ["/a", "/b/:id/c"],
      },
    });
    expect(getAuth()).toEqual({
      org: 8888,
      username: "mock-user",
      userInstanceId: "abc",
      accessRule: "cmdb",
      license: {
        blackList: ["/a", "/b/:id/c"],
      },
    });
    expect(isLoggedIn()).toEqual(true);
    expect(spyOnSetUserId).toBeCalledWith("abc");

    expect(isBlockedPath("/a")).toEqual(true);
    expect(isBlockedPath("/a/123")).toEqual(true);
    expect(isBlockedPath("/b")).toEqual(false);
    expect(isBlockedPath("/b/123")).toEqual(false);
    expect(isBlockedPath("/b/123/c")).toEqual(true);
    expect(isBlockedPath("/b/123/c/d")).toEqual(true);
    expect(isBlockedPath("/b/123/x")).toEqual(false);
    expect(isBlockedPath("/c")).toEqual(false);

    expect(isBlockedHref("/a")).toEqual(false);
    expect(isBlockedHref("/next/a")).toEqual(true);
    expect(isBlockedHref("a")).toEqual(true);
    expect(isBlockedHref("http://localhost/a")).toEqual(false);
    expect(isBlockedHref("http://localhost/next/a")).toEqual(true);
    expect(isBlockedHref("http://example.com/a")).toEqual(false);
    expect(isBlockedHref("http://example.com/next/a")).toEqual(false);

    expect(isBlockedUrl("/a?q=1")).toEqual(true);
    expect(isBlockedUrl("/next/a?q=1")).toEqual(false);
    expect(
      isBlockedUrl({
        pathname: "/a",
        search: "?q=1",
      })
    ).toEqual(true);
    expect(
      isBlockedUrl({
        pathname: "/next/a",
        search: "?q=1",
      })
    ).toEqual(false);
    expect(
      isBlockedUrl({
        search: "?q=1",
      })
    ).toEqual(false);

    expect(resetPermissionPreChecks).not.toBeCalled();
    logout();
    expect(getAuth()).toEqual({});
    expect(resetPermissionPreChecks).toBeCalled();
    expect(spyOnSetUserId).toBeCalledWith();
  });
});
