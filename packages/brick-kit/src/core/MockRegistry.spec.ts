import { registerMock, getMockList, getMockRule } from "./MockRegistry";
import { mockRule } from "@next-core/brick-types/src/manifest";

const register = () => {
  registerMock([
    {
      uri: "test-1/a/b/c/d/e",
      mockId: "1",
    },
    {
      uri: "test-2/a/b/:projectId/c",
      mockId: "2",
    },
    {
      uri: "test-3/a/b/:projectId/c/d/:instasnceId",
      mockId: "3",
    },
    {
      uri: "test-4/a/b/c/d/:instasnceId",
      mockId: "4",
    },
  ]);
};

describe("Mock Registry should work", () => {
  it("registerMock should work", () => {
    expect(getMockList().length).toBe(0);

    register();

    expect(getMockList().length).toBe(4);
  });

  it.each<[string, mockRule]>([
    ["test-1/a/b/c/d/e", { mockId: "1", uri: "test-1/a/b/c/d/e" }],
    ["test-1/a/b/c/d/e/", undefined],
    ["test-1/a/b/c/d/e/f", undefined],
    ["test-1/a/", undefined],
    [
      "test-2/a/b/P-101/c",
      {
        uri: "test-2/a/b/:projectId/c",
        mockId: "2",
      },
    ],
    ["test-2/a/b/c/d", undefined],
    [
      "test-3/a/b/P-101/c/d/12345",
      {
        uri: "test-3/a/b/:projectId/c/d/:instasnceId",
        mockId: "3",
      },
    ],
    ["test-3/a/b/P-101/c/d/12345/e", undefined],
    ["test-3/a/b/P-101/c/d/12345/", undefined],
    ["test-3/a/b/P-101/c/d/", undefined],
    ["test-3/a/b/P-101/c/d", undefined],
    [
      "test-4/a/b/c/d/balabala",
      {
        uri: "test-4/a/b/c/d/:instasnceId",
        mockId: "4",
      },
    ],
    ["test-4/a/b/c/d/balabala/e", undefined],
  ])("getMockRule args: %j ,should return %j", (param, result) => {
    register();
    expect(getMockRule(param)).toStrictEqual(result);
  });
});
