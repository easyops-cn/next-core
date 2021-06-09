import { getRelatedNodesBasedOnEvents } from "./getRelatedNodesBasedOnEvents";
import { BuilderRuntimeNode } from "../interfaces";

const mockConsoleWarn = jest
  .spyOn(console, "warn")
  .mockImplementation(() => void 0);

describe("getRelatedNodesBasedOnEvents", () => {
  it("should work", () => {
    // root node is custom template
    const data = new Map([
      [
        1,
        {
          upstreamNodes: new Set(),
          downstreamNodes: new Set(),
        },
      ],
      [
        2,
        {
          upstreamNodes: new Set([4]),
          downstreamNodes: new Set(),
        },
      ],
      [
        3,
        {
          upstreamNodes: new Set([4]),
          downstreamNodes: new Set(),
        },
      ],
      [
        4,
        {
          upstreamNodes: new Set(),
          downstreamNodes: new Set([2, 3]),
        },
      ],
      [
        5,
        {
          upstreamNodes: new Set(),
          downstreamNodes: new Set(),
        },
      ],
      [
        6,
        {
          upstreamNodes: new Set([7]),
          downstreamNodes: new Set(),
        },
      ],
      [
        7,
        {
          upstreamNodes: new Set(),
          downstreamNodes: new Set([6]),
        },
      ],
      [
        8,
        {
          upstreamNodes: new Set(),
          downstreamNodes: new Set([9, 11]),
        },
      ],
      [
        9,
        {
          upstreamNodes: new Set([8]),
          downstreamNodes: new Set([10]),
        },
      ],
      [
        10,
        {
          upstreamNodes: new Set([9]),
          downstreamNodes: new Set(),
        },
      ],
      [
        11,
        {
          upstreamNodes: new Set([8]),
          downstreamNodes: new Set(),
        },
      ],
    ]);
    // root node is not custom template
    const data2 = new Map([
      [
        1,
        {
          upstreamNodes: new Set(),
          downstreamNodes: new Set(),
        },
      ],
      [
        2,
        {
          upstreamNodes: new Set([4]),
          downstreamNodes: new Set(),
        },
      ],
      [
        3,
        {
          upstreamNodes: new Set([4]),
          downstreamNodes: new Set(),
        },
      ],
      [
        4,
        {
          upstreamNodes: new Set(),
          downstreamNodes: new Set([2, 3]),
        },
      ],
      [
        5,
        {
          upstreamNodes: new Set(),
          downstreamNodes: new Set(),
        },
      ],
      [
        6,
        {
          upstreamNodes: new Set(),
          downstreamNodes: new Set(),
        },
      ],
      [
        7,
        {
          upstreamNodes: new Set(),
          downstreamNodes: new Set(),
        },
      ],
      [
        8,
        {
          upstreamNodes: new Set(),
          downstreamNodes: new Set([9, 11]),
        },
      ],
      [
        9,
        {
          upstreamNodes: new Set([8]),
          downstreamNodes: new Set([10]),
        },
      ],
      [
        10,
        {
          upstreamNodes: new Set([9]),
          downstreamNodes: new Set(),
        },
      ],
      [
        11,
        {
          upstreamNodes: new Set([8]),
          downstreamNodes: new Set(),
        },
      ],
    ]);
    const nodes: BuilderRuntimeNode[] = [
      {
        type: "brick",
        brick: "my.brick-a",
        id: "B-001",
        $$matchedSelectors: ["my\\.brick-a"],
        $$parsedEvents: {},
        $$uid: 1,
      },
      {
        type: "brick",
        brick: "my.brick-b",
        id: "B-002",
        $$matchedSelectors: ["my\\.brick-b"],
        $$parsedEvents: {},
        $$uid: 2,
      },
      {
        type: "brick",
        brick: "my.brick-c",
        id: "B-003",
        $$matchedSelectors: ["my\\.brick-c", "#myBrickC"],
        $$parsedEvents: {},
        $$uid: 3,
      },
      {
        type: "brick",
        brick: "my.brick-d",
        id: "B-004",
        $$uid: 4,
        $$matchedSelectors: ["my\\.brick-d"],
        $$parsedEvents: {
          ignored: {
            action: "console.log",
          },
          click: {
            target: "my\\.brick-b",
            method: "open",
          },
          dblclick: [
            {
              useProvider: "my.any-provider",
              callback: {
                success: {
                  action: "console.log",
                },
                error: [
                  {
                    target: "#myBrickC",
                    method: "open",
                  },
                ],
                finally: null,
              },
            },
          ],
        },
      },
      {
        type: "brick",
        brick: "my.brick-e",
        id: "B-005",
        $$uid: 5,
        $$matchedSelectors: ["my\\.brick-e"],
        $$parsedEvents: {
          click: {
            target: "_self",
            method: "open",
          },
        },
      },
      {
        type: "brick",
        brick: "my.brick-f",
        id: "B-006",
        $$uid: 6,
        ref: "refBrickF",
        $$matchedSelectors: ["my\\.brick-f"],
        $$parsedEvents: {},
      },
      {
        type: "brick",
        brick: "my.brick-g",
        id: "B-007",
        $$uid: 7,
        $$matchedSelectors: ["my\\.brick-g"],
        $$parsedEvents: {
          click: [
            {
              targetRef: "refBrickF",
              method: "open",
            },
            {
              target: "<% oops %>",
              method: "open",
            },
          ],
        },
      },
      {
        // This brick has both lifeCycle and events.
        type: "brick",
        brick: "my.brick-h",
        id: "B-008",
        $$uid: 8,
        $$matchedSelectors: ["my\\.brick-h"],
        $$parsedLifeCycle: {
          onBeforePageLoad: {
            target: "#myBrickI",
            method: "open",
          },
        },
        $$parsedEvents: {
          click: {
            target: "#myBrickK",
            method: "open",
          },
        },
      },
      {
        type: "brick",
        brick: "my.brick-i",
        id: "B-009",
        $$uid: 9,
        $$matchedSelectors: ["my\\.brick-i", "#myBrickI"],
        $$parsedLifeCycle: {
          onMessage: {
            channel: "any",
            handlers: {
              target: "#myBrickJ",
              method: "open",
            },
          },
        },
      },
      {
        // This brick has an unknown lifeCycle.
        type: "brick",
        brick: "my.brick-j",
        id: "B-010",
        $$uid: 10,
        $$matchedSelectors: ["my\\.brick-j", "#myBrickJ"],
        $$parsedLifeCycle: {
          onOthers: {
            target: "#myBrickX",
            method: "open",
          },
        } as any,
      },
      {
        type: "brick",
        brick: "my.brick-k",
        id: "B-011",
        $$uid: 11,
        $$matchedSelectors: ["my\\.brick-k", "#myBrickK"],
      },
    ];
    expect(getRelatedNodesBasedOnEvents(nodes, true)).toEqual(data);
    expect(getRelatedNodesBasedOnEvents(nodes, false)).toEqual(data2);
    expect(mockConsoleWarn).toBeCalledTimes(2);
    expect(mockConsoleWarn).toBeCalledWith("unknown lifeCycle: onOthers");
  });
});
