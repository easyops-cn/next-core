import { userAnalytics } from "@next-core/easyops-analytics";
import {
  authenticate,
  getAuth,
  logout,
  isLoggedIn,
  isBlockedPath,
  isBlockedHref,
  isBlockedUrl,
  addPathToBlackList,
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

    addPathToBlackList("/c");
    expect(isBlockedPath("/c")).toEqual(true);

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

  it("should support query string matching in blacklist", () => {
    authenticate({
      org: 8888,
      username: "mock-user",
      userInstanceId: "abc",
      license: {
        blackList: ["/api/delete?confirm=true", "/users/:id/edit?mode=admin"],
      },
    });

    // 精确匹配：带查询字符串的黑名单
    expect(isBlockedPath("/api/delete?confirm=true")).toEqual(true);
    expect(isBlockedPath("/api/delete?confirm=false")).toEqual(false);
    expect(isBlockedPath("/api/delete")).toEqual(false);

    // 额外参数：待检查路径有额外参数应该匹配
    expect(isBlockedPath("/api/delete?confirm=true&extra=value")).toEqual(true);

    // 参数顺序：不同顺序应该匹配
    expect(isBlockedPath("/api/delete?extra=value&confirm=true")).toEqual(true);

    // 参数化路径 + 查询字符串
    expect(isBlockedPath("/users/123/edit?mode=admin")).toEqual(true);
    expect(isBlockedPath("/users/123/edit?mode=user")).toEqual(false);
    expect(isBlockedPath("/users/123/edit")).toEqual(false);
    expect(isBlockedPath("/users/456/edit?mode=admin")).toEqual(true);

    // 向后兼容：不带查询字符串的黑名单仍然工作
    addPathToBlackList("/old-api");
    expect(isBlockedPath("/old-api")).toEqual(true);
    expect(isBlockedPath("/old-api?any=param")).toEqual(true);
    expect(isBlockedPath("/old-api/sub")).toEqual(true);
  });
});
