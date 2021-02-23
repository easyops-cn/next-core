import { getBuilderNode } from "./getBuilderNode";

jest.spyOn(console, "error").mockImplementation(() => void 0);

describe("getBuilderNode", () => {
  it("should work", () => {
    expect(
      getBuilderNode(
        {
          type: "brick",
          brick: "my.any-brick",
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
      brick: "my.any-brick",
      id: "B-001",
      $$uid: 1,
      $$parsedProperties: {},
      $$parsedEvents: {},
      $$matchedSelectors: ["my\\.any-brick"],
    });
  });

  it("should work with alias", () => {
    expect(
      getBuilderNode(
        {
          type: "brick",
          brick: "my.any-brick",
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
      brick: "my.any-brick",
      id: "B-001",
      $$uid: 1,
      alias: "any-alias",
      $$parsedProperties: {},
      $$parsedEvents: {},
      $$matchedSelectors: ["my\\.any-brick"],
    });
  });

  it("should parse properties successfully", () => {
    expect(
      getBuilderNode(
        {
          type: "brick",
          brick: "my.any-brick",
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
      brick: "my.any-brick",
      id: "B-001",
      $$uid: 1,
      properties: '{"pageTitle":"Hello"}',
      $$parsedProperties: {
        pageTitle: "Hello",
      },
      $$parsedEvents: {},
      $$matchedSelectors: ["my\\.any-brick"],
    });
  });

  it("should cache error if parse properties failed", () => {
    expect(
      getBuilderNode(
        {
          type: "brick",
          brick: "my.any-brick",
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
      brick: "my.any-brick",
      id: "B-001",
      $$uid: 1,
      properties: "oops",
      $$parsedProperties: {},
      $$parsedEvents: {},
      $$matchedSelectors: ["my\\.any-brick"],
    });
  });

  it("should parse events successfully", () => {
    expect(
      getBuilderNode(
        {
          type: "brick",
          brick: "my.any-brick",
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
      brick: "my.any-brick",
      id: "B-001",
      $$uid: 1,
      events: '{"click":{"action":"console.log"}}',
      $$parsedProperties: {},
      $$parsedEvents: {
        click: {
          action: "console.log",
        },
      },
      $$matchedSelectors: ["my\\.any-brick"],
    });
  });

  it("should cache error if parse events failed", () => {
    expect(
      getBuilderNode(
        {
          type: "brick",
          brick: "my.any-brick",
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
      brick: "my.any-brick",
      id: "B-001",
      $$uid: 1,
      events: "oops",
      $$parsedProperties: {},
      $$parsedEvents: {},
      $$matchedSelectors: ["my\\.any-brick"],
    });
  });

  it("should add id to matched selectors", () => {
    expect(
      getBuilderNode(
        {
          type: "brick",
          brick: "my.any-brick",
          id: "B-001",
          parent: [],
          children: [],
          graphInfo: {},
          mountPoint: "brick",
          properties: '{"id":"myBrick"}',
        },
        1
      )
    ).toEqual({
      type: "brick",
      brick: "my.any-brick",
      id: "B-001",
      $$uid: 1,
      properties: '{"id":"myBrick"}',
      $$parsedProperties: {
        id: "myBrick",
      },
      $$parsedEvents: {},
      $$matchedSelectors: ["my\\.any-brick", "#myBrick"],
    });
  });

  it("should ignore dynamic id", () => {
    expect(
      getBuilderNode(
        {
          type: "brick",
          brick: "my.any-brick",
          id: "B-001",
          parent: [],
          children: [],
          graphInfo: {},
          mountPoint: "brick",
          properties: '{"id":"<% QUERY.x %>"}',
        },
        1
      )
    ).toEqual({
      type: "brick",
      brick: "my.any-brick",
      id: "B-001",
      $$uid: 1,
      properties: '{"id":"<% QUERY.x %>"}',
      $$parsedProperties: {
        id: "<% QUERY.x %>",
      },
      $$parsedEvents: {},
      $$matchedSelectors: ["my\\.any-brick"],
    });
  });

  it("should ignore route node", () => {
    expect(
      getBuilderNode(
        {
          type: "bricks",
          path: "/",
          id: "B-001",
          parent: [],
          children: [],
          graphInfo: {},
          mountPoint: "bricks",
        },
        1
      )
    ).toEqual({
      type: "bricks",
      path: "/",
      id: "B-001",
      $$uid: 1,
      $$parsedProperties: {},
      $$parsedEvents: {},
      $$matchedSelectors: [],
    });
  });
});
