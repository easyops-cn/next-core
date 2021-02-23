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
      $$parsedProperties: {},
      $$parsedEvents: {},
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
      $$parsedProperties: {},
      $$parsedEvents: {},
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
      $$parsedProperties: {
        pageTitle: "Hello",
      },
      $$parsedEvents: {},
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
      $$parsedProperties: {},
      $$parsedEvents: {},
    });
  });

  it("should parse events successfully", () => {
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
          events: '{"click":{"action":"console.log"}}',
        },
        1
      )
    ).toEqual({
      type: "brick",
      brick: "any-brick",
      id: "B-001",
      $$uid: 1,
      events: '{"click":{"action":"console.log"}}',
      $$parsedProperties: {},
      $$parsedEvents: {
        click: {
          action: "console.log",
        },
      },
    });
  });

  it("should cache error if parse events failed", () => {
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
          events: "oops",
        },
        1
      )
    ).toEqual({
      type: "brick",
      brick: "any-brick",
      id: "B-001",
      $$uid: 1,
      events: "oops",
      $$parsedProperties: {},
      $$parsedEvents: {},
    });
  });
});
