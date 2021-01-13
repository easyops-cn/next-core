import { getBuilderNode } from "./getBuilderNode";

describe("getBuilderNode", () => {
  it("should work", () => {
    expect(
      getBuilderNode(
        {
          type: "brick",
          brick: "any-brick",
          id: "B-001",
          parent: [],
          children: [],
          graphInfo: {},
          mountPoint: "brick",
        },
        1
      )
    ).toEqual({
      type: "brick",
      brick: "any-brick",
      id: "B-001",
      $$uid: 1,
      parsedProperties: {},
    });
  });

  it("should work with alias", () => {
    expect(
      getBuilderNode(
        {
          type: "brick",
          brick: "any-brick",
          id: "B-001",
          parent: [],
          children: [],
          graphInfo: {},
          mountPoint: "brick",
        },
        1,
        "any-alias"
      )
    ).toEqual({
      type: "brick",
      brick: "any-brick",
      id: "B-001",
      $$uid: 1,
      alias: "any-alias",
      parsedProperties: {},
    });
  });
});
