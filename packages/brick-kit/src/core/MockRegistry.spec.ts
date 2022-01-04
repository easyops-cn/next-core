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
        },
        {
          uri: "easyops.api.test.abc.getB/a/b/:projectId/c",
        },
        {
          uri: "easyops.api.test.abc.efg.getC/a/b/:projectId/c/d/:instasnceId",
        },
        {
          uri: "easyops.api.test.abc.getD/a/b/c/d/:instasnceId",
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

    expect(getMockList().length).toBe(4);

    expect(getMockList()).toStrictEqual([
      {
        uri: "(easyops.api.)?test.getA(@\\d+\\.\\d+\\.\\d+)?/a/b/c/d/e$",
      },
      {
        uri: "(easyops.api.)?test.abc.getB(@\\d+\\.\\d+\\.\\d+)?/a/b/([^/]+)/c$",
      },
      {
        uri: "(easyops.api.)?test.abc.efg.getC(@\\d+\\.\\d+\\.\\d+)?/a/b/([^/]+)/c/d/([^/]+)$",
      },
      {
        uri: "(easyops.api.)?test.abc.getD(@\\d+\\.\\d+\\.\\d+)?/a/b/c/d/([^/]+)$",
      },
    ]);
  });

  it.each<[string, string]>([
    [
      "api/gateway/easyops.api.test.getA/a/b/c/d/e",
      "api/gateway/mock_server.proxy.123/easyops.api.test.getA/a/b/c/d/e",
    ],
    [
      "api/gateway/easyops.api.test.getA@1.0.0/a/b/c/d/e",
      "api/gateway/mock_server.proxy.123/easyops.api.test.getA/a/b/c/d/e",
    ],
    ["api/gateway/easyops.api.test.getA:1.0.0/a/b/c/d/e", undefined],
    ["api/gateway/test.getA@1.a.0/a/b/c/d/e", undefined],
    [
      "api/gateway/easyops.api.untest.getA@123.345.567.789/a/b/c/d/e",
      undefined,
    ],
    ["api/gateway/api.test.getA/a/b/c/d/e@1.8.0", undefined],
    ["api/gateway/easyops.api.test.getA/a/b/c/d/e/", undefined],
    ["api/gateway/easyops.api.test.getA@1.0.0/a/b/c/d/e/f", undefined],
    ["api/gateway/easyops.api.test.getA@1.0.0/a/", undefined],
    [
      "api/gateway/easyops.api.test.abc.getB/a/b/P-101/c",
      "api/gateway/mock_server.proxy.123/easyops.api.test.abc.getB/a/b/P-101/c",
    ],
    [
      "api/gateway/easyops.api.test.abc.getB/a/b/@1.2.3/c",
      "api/gateway/mock_server.proxy.123/easyops.api.test.abc.getB/a/b/@1.2.3/c",
    ],
    ["api/gateway/easyops.api.test.abc.getB/a/b/c/d", undefined],
    [
      "api/gateway/test.abc.efg.getC@2.11.1/a/b/P-101/c/d/12345",
      "api/gateway/mock_server.proxy.123/test.abc.efg.getC/a/b/P-101/c/d/12345",
    ],
    ["api/gateway/test.abc.efg.getC@2.11.1/a/b/P-101/c/d/12345/e", undefined],
    ["api/gateway/test.abc.efg.getC@2.11.1/a/b/P-101/c/d/12345/", undefined],
    ["api/gateway/test.abc.efg.getC@2.11.1/a/b/P-101/c/d/", undefined],
    ["api/gateway/test.abc.efg.getC@2.11.1/a/b/P-101/c/d", undefined],
    [
      "api/gateway/easyops.api.test.abc.getD/a/b/c/d/balabala",
      "api/gateway/mock_server.proxy.123/easyops.api.test.abc.getD/a/b/c/d/balabala",
    ],
    ["api/gateway/easyops.api.test.abc.getD/a/b/c/d/balabala/e", undefined],
  ])("getMockRule args: %j ,should return %j", (param, result) => {
    register();
    expect(getMockInfo(param)?.url).toEqual(result);
  });
});
