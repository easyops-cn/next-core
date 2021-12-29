import { registerMock, getMockList, getMockId } from "./MockRegistry";

const register = (nothing?: boolean): void => {
  if (nothing) {
    registerMock(undefined);
  } else {
    registerMock({
      mockId: "123",
      mockList: [
        {
          uri: "easyops.api.test.getA@1.0.0/a/b/c/d/e",
        },
        {
          uri: "easyops.api.test.abc.getB@0.0.1/a/b/:projectId/c",
        },
        {
          uri: "easyops.api.test.abc.efg.getC@2.11.1/a/b/:projectId/c/d/:instasnceId",
        },
        {
          uri: "easyops.api.test.abc.getD@123.456.789/a/b/c/d/:instasnceId",
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
        uri: "(easyops.api.)?test.abc.getB(@\\d+\\.\\d+\\.\\d+)?/a/b/[\\w|-]+/c$",
      },
      {
        uri: "(easyops.api.)?test.abc.efg.getC(@\\d+\\.\\d+\\.\\d+)?/a/b/[\\w|-]+/c/d/[\\w|-]+$",
      },
      {
        uri: "(easyops.api.)?test.abc.getD(@\\d+\\.\\d+\\.\\d+)?/a/b/c/d/[\\w|-]+$",
      },
    ]);
  });

  it.each<[string, string]>([
    ["easyops.api.test.getA/a/b/c/d/e", "123"],
    ["easyops.api.test.getA@1.0.0/a/b/c/d/e", "123"],
    ["test.getA/a/b/c/d/e", "123"],
    ["test.getA@1.0.0/a/b/c/d/e", "123"],
    ["easyops.api.test.getA:1.0.0/a/b/c/d/e", undefined],
    ["test.getA@1.a.0/a/b/c/d/e", undefined],
    ["easyops.api.untest.getA@123.345.567.789/a/b/c/d/e", undefined],
    ["api.test.getA/a/b/c/d/e@1.8.0", undefined],
    ["easyops.api.test.getA/a/b/c/d/e/", undefined],
    ["easyops.api.test.getA@1.0.0/a/b/c/d/e/f", undefined],
    ["easyops.api.test.getA@1.0.0/a/", undefined],
    ["easyops.api.test.abc.getB/a/b/P-101/c", "123"],
    ["easyops.api.test.abc.getB/a/b/c/d", undefined],
    ["test.abc.efg.getC@2.11.1/a/b/P-101/c/d/12345", "123"],
    ["test.abc.efg.getC@2.11.1/a/b/P-101/c/d/12345/e", undefined],
    ["test.abc.efg.getC@2.11.1/a/b/P-101/c/d/12345/", undefined],
    ["test.abc.efg.getC@2.11.1/a/b/P-101/c/d/", undefined],
    ["test.abc.efg.getC@2.11.1/a/b/P-101/c/d", undefined],
    ["easyops.api.test.abc.getD/a/b/c/d/balabala", "123"],
    ["easyops.api.test.abc.getD/a/b/c/d/balabala/e", undefined],
  ])("getMockRule args: %j ,should return %j", (param, result) => {
    register();
    expect(getMockId(param)).toEqual(result);
  });
});
