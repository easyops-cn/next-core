import { BrickConf } from "@next-core/brick-types";
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
      displayName: "any-brick",
      $$uid: 1,
      $$parsedProperties: {},
      $$parsedEvents: {},
      $$parsedLifeCycle: {},
      $$matchedSelectors: ["my\\.any-brick"],
      $$normalized: {
        brick: "my.any-brick",
      },
      $$unreachable: false,
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
      displayName: "preset-alias",
      $$uid: 1,
      $$parsedProperties: {},
      $$parsedEvents: {},
      $$parsedLifeCycle: {},
      $$matchedSelectors: ["my\\.any-brick"],
      $$isTemplateInternalNode: true,
      $$normalized: {
        alias: "preset-alias",
        brick: "my.any-brick",
      },
      $$unreachable: false,
    });
  });

  it("should parse properties and events successfully", () => {
    const result = getBuilderNode(
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
    );
    expect(result).toEqual({
      type: "brick",
      brick: "my.any-brick",
      id: "B-001",
      displayName: "any-brick",
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
      $$normalized: {
        brick: "my.any-brick",
        properties: {
          pageTitle: "Hello",
        },
        events: {
          click: {
            action: "console.log",
          },
        },
      },
      $$unreachable: false,
    });
    expect(result.$$parsedProperties).not.toBe(
      (result.$$normalized as BrickConf).properties
    );
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
      displayName: "any-brick",
      $$uid: 1,
      properties: "oops",
      events: "ouch",
      $$parsedProperties: {},
      $$parsedEvents: {},
      $$parsedLifeCycle: {},
      $$matchedSelectors: ["my\\.any-brick"],
      $$normalized: {
        brick: "my.any-brick",
      },
      $$unreachable: false,
    });
  });

  it("should parse lifeCycle successfully", () => {
    expect(
      getBuilderNode(
        {
          type: "brick",
          brick: "my.any-brick",
          id: "B-001",
          parent: [],
          children: [],
          graphInfo: {},
          lifeCycle: '{"onPageLoad":{"target":"#modal","method":"open"}}',
        },
        1
      )
    ).toEqual({
      type: "brick",
      brick: "my.any-brick",
      id: "B-001",
      displayName: "any-brick",
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
      $$matchedSelectors: ["my\\.any-brick"],
      $$normalized: {
        brick: "my.any-brick",
        lifeCycle: {
          onPageLoad: {
            target: "#modal",
            method: "open",
          },
        },
      },
      $$unreachable: false,
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
      $$normalized: null,
      $$unreachable: false,
    });
  });

  it("should add id to matched selectors", () => {
    expect(
      getBuilderNode(
        {
          type: "brick",
          brick: "my.any-brick",
          alias: "any-brick",
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
      displayName: "myBrick",
      $$uid: 1,
      properties: '{"id":"myBrick"}',
      $$parsedProperties: {
        id: "myBrick",
      },
      $$parsedEvents: {},
      $$parsedLifeCycle: {},
      $$matchedSelectors: ["my\\.any-brick", "#myBrick"],
      $$normalized: {
        alias: "any-brick",
        brick: "my.any-brick",
        properties: {
          id: "myBrick",
        },
      },
      $$unreachable: false,
    });
  });

  it("should use dataset.testid as brick alias", () => {
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
          properties: '{"id":"myId","dataset":{"testid":"myBrick"}}',
        },
        1
      )
    ).toEqual({
      type: "brick",
      brick: "my.any-brick",
      id: "B-001",
      displayName: "myBrick",
      $$uid: 1,
      properties: '{"id":"myId","dataset":{"testid":"myBrick"}}',
      $$parsedProperties: {
        id: "myId",
        dataset: {
          testid: "myBrick",
        },
      },
      $$parsedEvents: {},
      $$parsedLifeCycle: {},
      $$matchedSelectors: ["my\\.any-brick"],
      $$normalized: {
        brick: "my.any-brick",
        properties: {
          id: "myId",
          dataset: {
            testid: "myBrick",
          },
        },
      },
      $$unreachable: false,
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
      displayName: "any-brick",
      $$uid: 1,
      properties: '{"id":"<% QUERY.x %>"}',
      $$parsedProperties: {
        id: "<% QUERY.x %>",
      },
      $$parsedEvents: {},
      $$parsedLifeCycle: {},
      $$matchedSelectors: ["my\\.any-brick"],
      $$normalized: {
        brick: "my.any-brick",
        properties: {
          id: "<% QUERY.x %>",
        },
      },
      $$unreachable: false,
    });
  });

  it("should ignore dynamic dataset.testid as brick alias", () => {
    expect(
      getBuilderNode(
        {
          type: "brick",
          brick: "my.any-brick",
          id: "B-001",
          if: "false",
          parent: [],
          children: [],
          graphInfo: {},
          mountPoint: "brick",
          properties: '{"dataset":{"testid":"${QUERY.any}"}}',
        },
        1
      )
    ).toEqual({
      type: "brick",
      brick: "my.any-brick",
      id: "B-001",
      displayName: "any-brick",
      if: "false",
      $$uid: 1,
      properties: '{"dataset":{"testid":"${QUERY.any}"}}',
      $$parsedProperties: {
        dataset: {
          testid: "${QUERY.any}",
        },
      },
      $$parsedEvents: {},
      $$parsedLifeCycle: {},
      $$matchedSelectors: ["my\\.any-brick"],
      $$normalized: {
        brick: "my.any-brick",
        properties: {
          dataset: {
            testid: "${QUERY.any}",
          },
        },
        if: false,
      },
      $$unreachable: true,
    });
  });

  it("should ignore route node", () => {
    expect(
      getBuilderNode(
        {
          type: "bricks",
          path: "/",
          id: "B-001",
          if: "false",
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
      if: "false",
      $$uid: 1,
      $$parsedProperties: {},
      $$parsedEvents: {},
      $$parsedLifeCycle: {},
      $$matchedSelectors: [],
      $$normalized: {
        type: "bricks",
        path: "/",
        if: false,
      },
      $$unreachable: true,
    });
  });
});
