import { registerMock, getMockList, getMockInfo } from "./MockRegistry";

const register = (nothing?: boolean): void => {
  if (nothing) {
    registerMock(undefined);
  } else {
    registerMock({
      mockId: "123",
      mockList: [
        {
          uri: "easyops.api.test.getA/a/b/c/d/e",
          provider: "provider-a",
          method: "GET",
        },
        {
          uri: "easyops.api.test.abc.getB/a/b/:projectId/c",
          provider: "provider-b",
          method: "GET",
        },
        {
          uri: "easyops.api.test.abc.efg.getC/a/b/:projectId/c/d/:instasnceId",
          provider: "provider-c",
          method: "GET",
        },
        {
          uri: "easyops.api.test.abc.getD/a/b/c/d/:instasnceId",
          provider: "provider-d",
          method: "LIST",
        },
        {
          uri: "easyops.api.test.abc.getD/a/b/c/d/:instasnceId",
          provider: "provider-e",
          method: "post",
        },
        {
          uri: "logic.cmdb.service/object/:objectId/list",
          provider: "flowBuilder@api-a",
          method: "get",
        },
      ],
    });
  }
};

describe("Mock Registry should work", () => {
  it("registerMock nothing should work", () => {
    register(true);

    expect(getMockList().length).toBe(0);
  });

  it("registerMock should work", () => {
    expect(getMockList().length).toBe(0);

    register();

    expect(getMockList().length).toBe(6);

    expect(getMockList()).toStrictEqual([
      {
        provider: "provider-a",
        method: "GET",
        uri: "test.getA(@\\d+\\.\\d+\\.\\d+)?/a/b/c/d/e$",
      },
      {
        provider: "provider-b",
        method: "GET",
        uri: "test.abc.getB(@\\d+\\.\\d+\\.\\d+)?/a/b/([^/]+)/c$",
      },
      {
        provider: "provider-c",
        method: "GET",
        uri: "test.abc.efg.getC(@\\d+\\.\\d+\\.\\d+)?/a/b/([^/]+)/c/d/([^/]+)$",
      },
      {
        provider: "provider-d",
        method: "LIST",
        uri: "test.abc.getD(@\\d+\\.\\d+\\.\\d+)?/a/b/c/d/([^/]+)$",
      },
      {
        provider: "provider-e",
        method: "post",
        uri: "test.abc.getD(@\\d+\\.\\d+\\.\\d+)?/a/b/c/d/([^/]+)$",
      },
      {
        uri: "logic.cmdb.service(@\\d+\\.\\d+\\.\\d+)?/object/([^/]+)/list$",
        provider: "flowBuilder@api-a",
        method: "get",
      },
    ]);
  });

  it.each<[string, string, string]>([
    [
      "api/gateway/easyops.api.test.getA/a/b/c/d/e",
      "get",
      "api/gateway/mock_server.proxy.123/easyops.api.test.getA/a/b/c/d/e",
    ],
    [
      "api/gateway/easyops.api.test.getA@1.0.0/a/b/c/d/e",
      "get",
      "api/gateway/mock_server.proxy.123/easyops.api.test.getA/a/b/c/d/e",
    ],
    ["api/gateway/easyops.api.test.getA@1.0.0/a/b/c/d/e", "post", undefined],
    ["api/gateway/easyops.api.test.getA:1.0.0/a/b/c/d/e", "POST", undefined],
    ["api/gateway/test.getA@1.a.0/a/b/c/d/e", "get", undefined],
    [
      "api/gateway/easyops.api.untest.getA@123.345.567.789/a/b/c/d/e",
      "get",
      undefined,
    ],
    ["api/gateway/api.test.getA/a/b/c/d/e@1.8.0", "get", undefined],
    ["api/gateway/easyops.api.test.getA/a/b/c/d/e/", "get", undefined],
    ["api/gateway/easyops.api.test.getA@1.0.0/a/b/c/d/e/f", "get", undefined],
    ["api/gateway/easyops.api.test.getA@1.0.0/a/", "get", undefined],
    [
      "api/gateway/easyops.api.test.abc.getB/a/b/P-101/c",
      "Get",
      "api/gateway/mock_server.proxy.123/easyops.api.test.abc.getB/a/b/P-101/c",
    ],
    [
      "api/gateway/easyops.api.test.abc.getB/a/b/@1.2.3/c",
      "get",
      "api/gateway/mock_server.proxy.123/easyops.api.test.abc.getB/a/b/@1.2.3/c",
    ],
    ["api/gateway/easyops.api.test.abc.getB/a/b/c/d", "get", undefined],
    [
      "api/gateway/test.abc.efg.getC@2.11.1/a/b/P-101/c/d/12345",
      "get",
      "api/gateway/mock_server.proxy.123/test.abc.efg.getC/a/b/P-101/c/d/12345",
    ],
    [
      "api/gateway/test.abc.efg.getC@2.11.1/a/b/P-101/c/d/12345/e",
      "get",
      undefined,
    ],
    [
      "api/gateway/test.abc.efg.getC@2.11.1/a/b/P-101/c/d/12345/",
      "get",
      undefined,
    ],
    ["api/gateway/test.abc.efg.getC@2.11.1/a/b/P-101/c/d/", "get", undefined],
    ["api/gateway/test.abc.efg.getC@2.11.1/a/b/P-101/c/d", "get", undefined],
    [
      "api/gateway/easyops.api.test.abc.getD/a/b/c/d/balabala",
      "get",
      "api/gateway/mock_server.proxy.123/easyops.api.test.abc.getD/a/b/c/d/balabala",
    ],
    [
      "api/gateway/easyops.api.test.abc.getD/a/b/c/d/balabala",
      "POST",
      "api/gateway/mock_server.proxy.123/easyops.api.test.abc.getD/a/b/c/d/balabala",
    ],
    [
      "api/gateway/easyops.api.test.abc.getD/a/b/c/d/balabala/e",
      "get",
      undefined,
    ],
    [
      "api/gateway/logic.cmdb.service/object/APP/list",
      "get",
      "api/gateway/mock_server.proxy.123/logic.cmdb.service/object/APP/list",
    ],
    ["api/gateway/logic.cmdb.service/object/APP/list", "post", undefined],
    ["api/gateway/logic.cmdb.service/object/APP/list/abc", "get", undefined],
    ["api/gateway/logic.cmdb.service/object/APP", "get", undefined],
  ])("getMockRule args: %j ,should return %j", (param, method, result) => {
    register();
    expect(getMockInfo(param, method)?.url).toEqual(result);
  });
});
