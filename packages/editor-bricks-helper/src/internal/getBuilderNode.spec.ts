import { getBuilderNode } from "./getBuilderNode";

jest.spyOn(console, "error").mockImplementation(() => void 0);

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

  it("should parse properties successfully", () => {
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
          properties: '{"pageTitle":"Hello"}',
        },
        1
      )
    ).toEqual({
      type: "brick",
      brick: "any-brick",
      id: "B-001",
      $$uid: 1,
      properties: '{"pageTitle":"Hello"}',
      parsedProperties: {
        pageTitle: "Hello",
      },
    });
  });

  it("should cache error if parse properties failed", () => {
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
          properties: "oops",
        },
        1
      )
    ).toEqual({
      type: "brick",
      brick: "any-brick",
      id: "B-001",
      $$uid: 1,
      properties: "oops",
      parsedProperties: {},
    });
  });
});
