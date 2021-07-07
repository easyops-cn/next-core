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
      alias: "any-brick",
      $$uid: 1,
      $$parsedProperties: {},
      $$parsedEvents: {},
      $$parsedLifeCycle: {},
      $$matchedSelectors: ["my\\.any-brick"],
    });
  });

  it("should work with alias", () => {
    expect(
      getBuilderNode(
        {
          type: "brick",
          brick: "my.any-brick",
          alias: "preset-alias",
          id: "B-001",
          parent: [],
          children: [],
          graphInfo: {},
          mountPoint: "brick",
        },
        1,
        true
      )
    ).toEqual({
      type: "brick",
      brick: "my.any-brick",
      id: "B-001",
      alias: "preset-alias",
      $$uid: 1,
      $$parsedProperties: {},
      $$parsedEvents: {},
      $$parsedLifeCycle: {},
      $$matchedSelectors: ["my\\.any-brick"],
      $$isTemplateInternalNode: true,
    });
  });

  it("should parse properties and events successfully", () => {
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
          events: '{"click":{"action":"console.log"}}',
        },
        1
      )
    ).toEqual({
      type: "brick",
      brick: "my.any-brick",
      id: "B-001",
      alias: "any-brick",
      $$uid: 1,
      properties: '{"pageTitle":"Hello"}',
      events: '{"click":{"action":"console.log"}}',
      $$parsedProperties: {
        pageTitle: "Hello",
      },
      $$parsedEvents: {
        click: {
          action: "console.log",
        },
      },
      $$parsedLifeCycle: {},
      $$matchedSelectors: ["my\\.any-brick"],
    });
  });

  it("should cache error if parse properties and events failed", () => {
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
          events: "ouch",
        },
        1
      )
    ).toEqual({
      type: "brick",
      brick: "my.any-brick",
      id: "B-001",
      alias: "any-brick",
      $$uid: 1,
      properties: "oops",
      events: "ouch",
      $$parsedProperties: {},
      $$parsedEvents: {},
      $$parsedLifeCycle: {},
      $$matchedSelectors: ["my\\.any-brick"],
    });
  });

  it("should cache error if parse proxy failed", () => {
    expect(
      getBuilderNode(
        {
          type: "custom-template",
          templateId: "tpl-my-template",
          id: "B-001",
          parent: [],
          children: [],
          graphInfo: {},
          proxy: "oops",
        },
        1
      )
    ).toEqual({
      type: "custom-template",
      templateId: "tpl-my-template",
      id: "B-001",
      $$uid: 1,
      proxy: "oops",
      $$parsedProperties: {},
      $$parsedEvents: {},
      $$parsedLifeCycle: {},
      $$matchedSelectors: [],
    });
  });

  it("should parse lifeCycle successfully", () => {
    expect(
      getBuilderNode(
        {
          type: "custom-template",
          templateId: "tpl-my-template",
          id: "B-001",
          parent: [],
          children: [],
          graphInfo: {},
          lifeCycle: '{"onPageLoad":{"target":"#modal","method":"open"}}',
        },
        1
      )
    ).toEqual({
      type: "custom-template",
      templateId: "tpl-my-template",
      id: "B-001",
      $$uid: 1,
      lifeCycle: '{"onPageLoad":{"target":"#modal","method":"open"}}',
      $$parsedProperties: {},
      $$parsedEvents: {},
      $$parsedLifeCycle: {
        onPageLoad: {
          target: "#modal",
          method: "open",
        },
      },
      $$matchedSelectors: [],
    });
  });

  it("should cache error if parse lifeCycle failed", () => {
    expect(
      getBuilderNode(
        {
          type: "custom-template",
          templateId: "tpl-my-template",
          id: "B-001",
          parent: [],
          children: [],
          graphInfo: {},
          lifeCycle: "oops",
        },
        1
      )
    ).toEqual({
      type: "custom-template",
      templateId: "tpl-my-template",
      id: "B-001",
      $$uid: 1,
      lifeCycle: "oops",
      $$parsedProperties: {},
      $$parsedEvents: {},
      $$parsedLifeCycle: {},
      $$matchedSelectors: [],
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
      alias: "any-brick",
      $$uid: 1,
      properties: '{"id":"myBrick"}',
      $$parsedProperties: {
        id: "myBrick",
      },
      $$parsedEvents: {},
      $$parsedLifeCycle: {},
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
      alias: "any-brick",
      $$uid: 1,
      properties: '{"id":"<% QUERY.x %>"}',
      $$parsedProperties: {
        id: "<% QUERY.x %>",
      },
      $$parsedEvents: {},
      $$parsedLifeCycle: {},
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
      $$parsedLifeCycle: {},
      $$matchedSelectors: [],
    });
  });
});
