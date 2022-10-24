import { BuilderCustomTemplateNode } from "@next-core/brick-types";
import { getAppendingNodesAndEdges as _getAppendingNodesAndEdges } from "./getAppendingNodesAndEdges";

// Given two templates:
//
//    T-1      T-2
//     ↓        ↓
//   TB-1     TB-3
//     ↓        ↓
//   TB-2     TB-4
const templateSourceMap = new Map<string, BuilderCustomTemplateNode>([
  [
    "tpl-micro-view",
    {
      id: "T-1",
      templateId: "tpl-micro-view",
      type: "custom-template",
      proxy: JSON.stringify({
        slots: { toolbar: { ref: "microView", refSlot: "toolbar" } },
        properties: {
          microTitle: { ref: "microView", refProperty: "easyTitle" },
          notExistedProperty: { ref: "notExistedRef", refProperty: "any" },
        },
      }),
      children: [
        {
          id: "TB-1",
          type: "brick",
          brick: "tpl-easy-view",
          mountPoint: "bricks",
          ref: "microView",
          children: [
            {
              id: "TB-2",
              type: "brick",
              brick: "basic-bricks.general-table",
              ref: "generalTable",
              mountPoint: "content",
            },
          ],
        },
      ],
    },
  ],
  [
    "tpl-easy-view",
    {
      id: "T-2",
      templateId: "tpl-easy-view",
      type: "custom-template",
      proxy: JSON.stringify({
        slots: { content: { ref: "easyView", refSlot: "content" } },
        properties: {
          easyTitle: { ref: "pageTitle", refProperty: "pageTitle" },
        },
      }),
      children: [
        {
          id: "TB-3",
          type: "brick",
          brick: "basic-bricks.easy-view",
          mountPoint: "bricks",
          ref: "easyView",
          children: [
            {
              id: "TB-4",
              type: "brick",
              brick: "basic-bricks.page-title",
              ref: "pageTitle",
              mountPoint: "header",
              properties: '{"any":"value"}',
            },
          ],
        },
      ],
    },
  ],
  [
    "tpl-page-wrapper-theme",
    {
      id: "T-3",
      templateId: "tpl-page-wrapper-theme",
      type: "custom-template",
      layoutType: "wrapper",
      proxy: JSON.stringify({
        slots: { content: { ref: "easyView", refSlot: "content" } },
        properties: {
          easyTitle: { ref: "pageTitle", refProperty: "pageTitle" },
        },
      }),
      children: [
        {
          id: "TT-1",
          type: "brick",
          brick: "basic-bricks.easy-view",
          mountPoint: "bricks",
          ref: "easyView",
          children: [
            {
              id: "TT-2",
              type: "brick",
              brick: "tpl-page-wrapper-theme-1",
              ref: "pageTitle",
              mountPoint: "header",
              properties: '{"any":"value"}',
            },
          ],
        },
      ],
    },
  ],
  [
    "tpl-page-wrapper-theme-1",
    {
      id: "T-4",
      templateId: "tpl-page-wrapper-theme-1",
      type: "custom-template",
      layoutType: "wrapper",
      children: [
        {
          id: "TT-3",
          type: "brick",
          brick: "basic-bricks.general-button",
          mountPoint: "bricks",
          children: [],
        },
      ],
    },
  ],
]);

describe("getAppendingNodesAndEdges", () => {
  let getAppendingNodesAndEdges: typeof _getAppendingNodesAndEdges;
  beforeEach(() => {
    jest.resetModules();
    getAppendingNodesAndEdges =
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require("./getAppendingNodesAndEdges").getAppendingNodesAndEdges;
  });

  it("should work for normal bricks", () => {
    const result = getAppendingNodesAndEdges(
      {
        id: "B-1",
        type: "brick",
        brick: "basic-bricks.micro-view",
        children: [
          {
            id: "B-2",
            type: "brick",
            brick: "basic-bricks.general-button",
            mountPoint: "toolbar",
          },
        ],
      },
      1000,
      new Map()
    );
    expect(result).toEqual({
      nodes: [
        expect.objectContaining({
          $$uid: 1000,
          id: "B-1",
          $$isTemplateInternalNode: undefined,
        }),
        expect.objectContaining({
          $$uid: 1,
          id: "B-2",
          $$isTemplateInternalNode: undefined,
        }),
      ],
      edges: [
        expect.objectContaining({
          parent: 1000,
          child: 1,
          $$isTemplateInternal: undefined,
          $$isTemplateDelegated: undefined,
          mountPoint: "toolbar",
        }),
      ],
    });
    expect(result.nodes[0].$$isExpandableTemplate).toBeUndefined();
    expect(result.nodes[1].$$isExpandableTemplate).toBeUndefined();
  });

  it("should work for templates with empty children", () => {
    const result = getAppendingNodesAndEdges(
      {
        id: "B-1",
        type: "brick",
        brick: "tpl-micro-view",
      },
      1000,
      new Map([
        [
          "tpl-micro-view",
          {
            id: "T-1",
            templateId: "tpl-micro-view",
            type: "custom-template",
            children: [],
          },
        ],
      ])
    );
    expect(result).toEqual({
      nodes: [
        expect.objectContaining({
          $$uid: 1000,
          id: "B-1",
          $$isTemplateInternalNode: undefined,
        }),
      ],
      edges: [],
    });
    expect(result.nodes[0].$$isExpandableTemplate).toBeUndefined();
  });

  it("should work for templates", () => {
    const result = getAppendingNodesAndEdges(
      {
        id: "B-1",
        type: "brick",
        brick: "tpl-easy-view",
        children: [
          {
            id: "B-2",
            type: "brick",
            brick: "general-graph",
            mountPoint: "content",
          },
        ],
      },
      1000,
      templateSourceMap
    );
    expect(result).toEqual({
      nodes: [
        expect.objectContaining({
          $$uid: 1000,
          id: "B-1",
          $$isTemplateInternalNode: undefined,
          $$isExpandableTemplate: true,
          $$templateProxy: {
            slots: { content: { ref: "easyView", refSlot: "content" } },
            properties: {
              easyTitle: { ref: "pageTitle", refProperty: "pageTitle" },
            },
          },
          $$parsedProperties: {},
        }),
        expect.objectContaining({
          $$uid: 1,
          id: "TB-3",
          $$isTemplateInternalNode: true,
          $$parsedProperties: {},
        }),
        expect.objectContaining({
          $$uid: 2,
          id: "TB-4",
          $$isTemplateInternalNode: true,
          $$parsedProperties: {
            any: "value",
          },
        }),
        expect.objectContaining({
          $$uid: 3,
          id: "B-2",
          $$isTemplateInternalNode: undefined,
          $$parsedProperties: {},
        }),
      ],
      edges: [
        expect.objectContaining({
          parent: 1,
          child: 2,
          $$isTemplateInternal: true,
          $$isTemplateDelegated: undefined,
          mountPoint: "header",
        }),
        expect.objectContaining({
          parent: 1000,
          child: 1,
          $$isTemplateInternal: true,
          mountPoint: "",
        }),
        expect.objectContaining({
          parent: 1000,
          child: 3,
          $$isTemplateInternal: undefined,
          $$isTemplateDelegated: true,
          mountPoint: "content",
        }),
      ],
    });
    // Map values do not work with `expect.objectContaining`.
    expect(result.nodes[0].$$templateRefToUid).toEqual(
      new Map([
        ["easyView", 1],
        ["pageTitle", 2],
      ])
    );
    const nodesWithDelegatedSlots = result.nodes.filter(
      (node) => node.$$delegatedSlots
    );
    expect(nodesWithDelegatedSlots.length).toBe(1);
    expect(nodesWithDelegatedSlots[0]).toMatchObject({
      id: "TB-3",
      $$delegatedSlots: new Map([
        [
          "content",
          [
            {
              templateUid: 1000,
              templateMountPoint: "content",
            },
          ],
        ],
      ]),
    });
  });

  it("should work for nested templates", () => {
    const result = getAppendingNodesAndEdges(
      {
        id: "B-1",
        type: "brick",
        brick: "tpl-micro-view",
        children: [
          {
            id: "B-2",
            type: "brick",
            brick: "general-button",
            mountPoint: "toolbar",
          },
        ],
        properties: '{"microTitle":"Hello World","notExistedProperty":"oops"}',
      },
      1000,
      templateSourceMap
    );
    expect(result).toEqual({
      nodes: [
        expect.objectContaining({
          $$uid: 1000,
          id: "B-1",
          $$isTemplateInternalNode: undefined,
          $$isExpandableTemplate: true,
          $$templateProxy: {
            slots: { toolbar: { ref: "microView", refSlot: "toolbar" } },
            properties: {
              microTitle: { ref: "microView", refProperty: "easyTitle" },
              notExistedProperty: { ref: "notExistedRef", refProperty: "any" },
            },
          },
          $$parsedProperties: {
            microTitle: "Hello World",
            notExistedProperty: "oops",
          },
        }),
        expect.objectContaining({
          $$uid: 1,
          id: "TB-1",
          $$isTemplateInternalNode: true,
          $$isExpandableTemplate: true,
          $$templateProxy: {
            slots: { content: { ref: "easyView", refSlot: "content" } },
            properties: {
              easyTitle: { ref: "pageTitle", refProperty: "pageTitle" },
            },
          },
          $$parsedProperties: {
            easyTitle: "Hello World",
          },
        }),
        expect.objectContaining({
          $$uid: 2,
          id: "TB-3",
          $$isTemplateInternalNode: true,
          $$parsedProperties: {},
        }),
        expect.objectContaining({
          $$uid: 3,
          id: "TB-4",
          $$isTemplateInternalNode: true,
          $$parsedProperties: {
            any: "value",
            pageTitle: "Hello World",
          },
        }),
        expect.objectContaining({
          $$uid: 4,
          id: "TB-2",
          $$isTemplateInternalNode: true,
          $$parsedProperties: {},
        }),
        expect.objectContaining({
          $$uid: 5,
          id: "B-2",
          $$isTemplateInternalNode: undefined,
          $$parsedProperties: {},
        }),
      ],
      edges: [
        expect.objectContaining({
          parent: 2,
          child: 3,
          $$isTemplateInternal: true,
          $$isTemplateDelegated: undefined,
          mountPoint: "header",
        }),
        expect.objectContaining({
          parent: 1,
          child: 2,
          $$isTemplateInternal: true,
          mountPoint: "",
        }),
        expect.objectContaining({
          parent: 1,
          child: 4,
          $$isTemplateInternal: true,
          $$isTemplateDelegated: true,
          mountPoint: "content",
        }),
        expect.objectContaining({
          parent: 1000,
          child: 1,
          $$isTemplateInternal: true,
          mountPoint: "",
        }),
        expect.objectContaining({
          parent: 1000,
          child: 5,
          $$isTemplateInternal: undefined,
          $$isTemplateDelegated: true,
          mountPoint: "toolbar",
        }),
      ],
    });
    // Map values do not work with `expect.objectContaining`.
    expect(result.nodes[0].$$templateRefToUid).toEqual(
      new Map([
        ["microView", 1],
        ["generalTable", 4],
      ])
    );
    expect(result.nodes[1].$$templateRefToUid).toEqual(
      new Map([
        ["easyView", 2],
        ["pageTitle", 3],
      ])
    );
    const nodesWithDelegatedSlots = result.nodes.filter(
      (node) => node.$$delegatedSlots
    );
    expect(nodesWithDelegatedSlots.length).toBe(0);
  });

  it("should work when root is a custom-template", () => {
    const result = getAppendingNodesAndEdges(
      {
        id: "T-1",
        templateId: "tpl-micro-view",
        type: "custom-template",
        proxy: JSON.stringify({
          slots: { toolbar: { ref: "microView", refSlot: "toolbar" } },
        }),
        children: [
          {
            id: "TB-1",
            type: "brick",
            brick: "tpl-easy-view",
            mountPoint: "bricks",
            ref: "microView",
            children: [
              {
                id: "TB-2",
                type: "brick",
                brick: "basic-bricks.general-table",
                mountPoint: "content",
              },
            ],
          },
        ],
      },
      1000,
      templateSourceMap
    );
    expect(result).toEqual({
      nodes: [
        expect.objectContaining({
          $$uid: 1000,
          id: "T-1",
          type: "custom-template",
          $$isTemplateInternalNode: undefined,
        }),
        expect.objectContaining({
          $$uid: 1,
          id: "TB-1",
          $$isTemplateInternalNode: undefined,
          $$isExpandableTemplate: true,
        }),
        expect.objectContaining({
          $$uid: 2,
          id: "TB-3",
          $$isTemplateInternalNode: true,
        }),
        expect.objectContaining({
          $$uid: 3,
          id: "TB-4",
          $$isTemplateInternalNode: true,
        }),
        expect.objectContaining({
          $$uid: 4,
          id: "TB-2",
          $$isTemplateInternalNode: undefined,
        }),
      ],
      edges: [
        expect.objectContaining({
          parent: 2,
          child: 3,
          $$isTemplateInternal: true,
          $$isTemplateDelegated: undefined,
          mountPoint: "header",
        }),
        expect.objectContaining({
          parent: 1,
          child: 2,
          $$isTemplateInternal: true,
          mountPoint: "",
        }),
        expect.objectContaining({
          parent: 1,
          child: 4,
          $$isTemplateInternal: undefined,
          $$isTemplateDelegated: true,
          mountPoint: "content",
        }),
        expect.objectContaining({
          parent: 1000,
          child: 1,
          $$isTemplateInternal: undefined,
          $$isTemplateDelegated: undefined,
          mountPoint: "bricks",
        }),
      ],
    });
    expect(result.nodes[0].$$isExpandableTemplate).toBeUndefined();
    const nodesWithDelegatedSlots = result.nodes.filter(
      (node) => node.$$delegatedSlots
    );
    expect(nodesWithDelegatedSlots.length).toBe(1);
    expect(nodesWithDelegatedSlots[0]).toMatchObject({
      id: "TB-3",
      $$delegatedSlots: new Map([
        [
          "content",
          [
            {
              templateUid: 1,
              templateMountPoint: "content",
            },
          ],
        ],
      ]),
    });
  });

  it("should work for widget", () => {
    const result = getAppendingNodesAndEdges(
      {
        id: "B-1",
        type: "brick",
        brick: "widget.tpl-test-widget",
        children: [
          {
            id: "B-2",
            type: "brick",
            brick: "general-button",
            mountPoint: "toolbar",
          },
          {
            id: "B-3",
            type: "brick",
            brick: "widget.tpl-inside-widget",
            mountPoint: "content",
          },
        ],
        properties: '{"microTitle":"Hello World","notExistedProperty":"oops"}',
      },
      1000,
      new Map(),
      [
        {
          storyId: "widget.tpl-test-widget",
          category: "abc",
          type: "brick",
          text: {},
          conf: [],
          originData: {
            appId: "widget",
            id: "T-01",
            instanceId: "t",
            templateId: "tpl-test-widget",
            creator: "abc",
            proxy: null,
            type: "custom-template",
            children: [
              {
                id: "T-02",
                instanceId: "t-1",
                type: "brick",
                brick: "easy-view",
                children: [
                  {
                    id: "T-03",
                    instanceId: "t-1-1",
                    type: "brick",
                    brick: "general-button",
                    mountPoint: "a",
                  },
                  {
                    id: "T-04",
                    instanceId: "t-1-2",
                    type: "brick",
                    brick: "widget.tpl-inside-widget",
                    mountPoint: "b",
                  },
                ],
              },
            ],
          },
        },
        {
          storyId: "widget.tpl-inside-widget",
          category: "abc",
          type: "brick",
          text: {},
          conf: [],
          originData: {
            appId: "widget",
            id: "T-05",
            instanceId: "t",
            templateId: "tpl-inside-widget",
            creator: "abc",
            proxy: null,
            type: "custom-template",
            children: [
              {
                id: "T-06",
                instanceId: "t-1",
                type: "brick",
                brick: "general-select",
              },
            ],
          },
        },
      ]
    );
    expect(result).toEqual({
      edges: [
        {
          $$isTemplateDelegated: undefined,
          $$isTemplateInternal: true,
          child: 2,
          mountPoint: "a",
          parent: 1,
          sort: 0,
        },
        {
          $$isTemplateInternal: true,
          child: 4,
          mountPoint: "",
          parent: 3,
          sort: 0,
        },
        {
          $$isTemplateDelegated: undefined,
          $$isTemplateInternal: true,
          child: 3,
          mountPoint: "b",
          parent: 1,
          sort: 1,
        },
        {
          $$isTemplateInternal: true,
          child: 1,
          mountPoint: "",
          parent: 1000,
          sort: 0,
        },
        {
          $$isTemplateDelegated: true,
          $$isTemplateInternal: undefined,
          child: 5,
          mountPoint: "toolbar",
          parent: 1000,
          sort: 0,
        },
        {
          $$isTemplateInternal: true,
          child: 7,
          mountPoint: "",
          parent: 6,
          sort: 0,
        },
        {
          $$isTemplateDelegated: true,
          $$isTemplateInternal: undefined,
          child: 6,
          mountPoint: "content",
          parent: 1000,
          sort: 1,
        },
      ],
      nodes: [
        {
          $$isExpandableTemplate: true,
          $$isTemplateInternalNode: undefined,
          $$matchedSelectors: ["widget\\.tpl-test-widget"],
          $$normalized: {
            brick: "widget.tpl-test-widget",
            properties: {
              microTitle: "Hello World",
              notExistedProperty: "oops",
            },
          },
          $$parsedEvents: {},
          $$parsedLifeCycle: {},
          $$parsedProperties: {
            microTitle: "Hello World",
            notExistedProperty: "oops",
          },
          $$templateProxy: null,
          $$templateRefToUid: new Map(),
          $$uid: 1000,
          $$unreachable: false,
          alias: "tpl-test-widget",
          brick: "widget.tpl-test-widget",
          id: "B-1",
          properties:
            '{"microTitle":"Hello World","notExistedProperty":"oops"}',
          type: "brick",
        },
        {
          $$isTemplateInternalNode: true,
          $$matchedSelectors: ["easy-view"],
          $$normalized: { brick: "easy-view", iid: "t-1" },
          $$parsedEvents: {},
          $$parsedLifeCycle: {},
          $$parsedProperties: {},
          $$uid: 1,
          $$unreachable: false,
          alias: "easy-view",
          brick: "easy-view",
          id: "T-02",
          instanceId: "t-1",
          type: "brick",
        },
        {
          $$isTemplateInternalNode: true,
          $$matchedSelectors: ["general-button"],
          $$normalized: { brick: "general-button", iid: "t-1-1" },
          $$parsedEvents: {},
          $$parsedLifeCycle: {},
          $$parsedProperties: {},
          $$uid: 2,
          $$unreachable: false,
          alias: "general-button",
          brick: "general-button",
          id: "T-03",
          instanceId: "t-1-1",
          type: "brick",
        },
        {
          $$isExpandableTemplate: true,
          $$isTemplateInternalNode: true,
          $$matchedSelectors: ["widget\\.tpl-inside-widget"],
          $$normalized: { brick: "widget.tpl-inside-widget", iid: "t-1-2" },
          $$parsedEvents: {},
          $$parsedLifeCycle: {},
          $$parsedProperties: {},
          $$templateProxy: null,
          $$templateRefToUid: new Map(),
          $$uid: 3,
          $$unreachable: false,
          alias: "tpl-inside-widget",
          brick: "widget.tpl-inside-widget",
          id: "T-04",
          instanceId: "t-1-2",
          type: "brick",
        },
        {
          $$isTemplateInternalNode: true,
          $$matchedSelectors: ["general-select"],
          $$normalized: { brick: "general-select", iid: "t-1" },
          $$parsedEvents: {},
          $$parsedLifeCycle: {},
          $$parsedProperties: {},
          $$uid: 4,
          $$unreachable: false,
          alias: "general-select",
          brick: "general-select",
          id: "T-06",
          instanceId: "t-1",
          type: "brick",
        },
        {
          $$isTemplateInternalNode: undefined,
          $$matchedSelectors: ["general-button"],
          $$normalized: { brick: "general-button" },
          $$parsedEvents: {},
          $$parsedLifeCycle: {},
          $$parsedProperties: {},
          $$uid: 5,
          $$unreachable: false,
          alias: "general-button",
          brick: "general-button",
          id: "B-2",
          type: "brick",
        },
        {
          $$isExpandableTemplate: true,
          $$isTemplateInternalNode: undefined,
          $$matchedSelectors: ["widget\\.tpl-inside-widget"],
          $$normalized: { brick: "widget.tpl-inside-widget" },
          $$parsedEvents: {},
          $$parsedLifeCycle: {},
          $$parsedProperties: {},
          $$templateProxy: null,
          $$templateRefToUid: new Map(),
          $$uid: 6,
          $$unreachable: false,
          alias: "tpl-inside-widget",
          brick: "widget.tpl-inside-widget",
          id: "B-3",
          type: "brick",
        },
        {
          $$isTemplateInternalNode: true,
          $$matchedSelectors: ["general-select"],
          $$normalized: { brick: "general-select", iid: "t-1" },
          $$parsedEvents: {},
          $$parsedLifeCycle: {},
          $$parsedProperties: {},
          $$uid: 7,
          $$unreachable: false,
          alias: "general-select",
          brick: "general-select",
          id: "T-06",
          instanceId: "t-1",
          type: "brick",
        },
      ],
    });
  });

  // Given templates:
  //
  // 1. tpl-basic-view contains:
  //    - page-title
  //    - tpl-three-row-view
  //
  // It exposes `tpl-three-row-view`'s slots by:
  //   `beforeTopContent` : `beforeTop`
  //   `centerContent` : `center`
  //   `beforeBottomContent` : `beforeBottom`
  //   `afterBottomContent` : `afterBottom`
  //
  // 2. tpl-three-row-view contains
  //    - easy-view
  //      (t)
  //        general-button
  //
  // It exposes `easy-view`'s slots by:
  //   `beforeTop` : `t`
  //   `afterTop` : `t`
  //   `center` : `c`
  //   `beforeBottom` : `b`
  //   `afterBottom` : `b`
  it("should work for nested templates with nested slots proxy", () => {
    const result = getAppendingNodesAndEdges(
      {
        id: "B-a",
        type: "brick",
        brick: "tpl-basic-view",
        children: [
          {
            id: "B-b",
            type: "brick",
            brick: "tpl-empty",
            mountPoint: "header",
          },
        ],
      },
      1000,
      new Map([
        [
          "tpl-basic-view",
          {
            id: "T-a",
            type: "custom-template",
            templateId: "tpl-basic-view",
            proxy: JSON.stringify({
              slots: {
                beforeTopContent: { ref: "threeRowView", refSlot: "beforeTop" },
                centerContent: { ref: "threeRowView", refSlot: "center" },
                beforeBottomContent: {
                  ref: "threeRowView",
                  refSlot: "beforeBottom",
                },
                afterBottomContent: {
                  ref: "threeRowView",
                  refSlot: "afterBottom",
                },
                notExistedSlot: { ref: "notExistedRef", refSlot: "any" },
              },
            }),
            children: [
              {
                id: "TB-a",
                type: "brick",
                brick: "page-title",
              },
              {
                id: "TB-b",
                type: "brick",
                brick: "tpl-three-row-view",
                ref: "threeRowView",
              },
            ],
          },
        ],
        [
          "tpl-three-row-view",
          {
            id: "T-b",
            type: "custom-template",
            templateId: "tpl-three-row-view",
            proxy: JSON.stringify({
              slots: {
                beforeTop: { ref: "easyView", refSlot: "t", refPosition: 0 },
                afterTop: { ref: "easyView", refSlot: "t" },
                center: { ref: "easyView", refSlot: "c" },
                beforeBottom: { ref: "easyView", refSlot: "b", refPosition: 0 },
                afterBottom: { ref: "easyView", refSlot: "b" },
              },
            }),
            children: [
              {
                id: "TB-c",
                type: "brick",
                brick: "basic-bricks.easy-view",
                ref: "easyView",
                children: [
                  {
                    id: "TB-d",
                    type: "brick",
                    brick: "general-header",
                    mountPoint: "t",
                  },
                  {
                    id: "TB-e",
                    type: "brick",
                    brick: "general-footer",
                    mountPoint: "b",
                  },
                ],
              },
            ],
          },
        ],
        [
          "tpl-empty",
          {
            id: "T-c",
            type: "custom-template",
            templateId: "tpl-empty",
            children: [
              {
                id: "TB-f",
                type: "brick",
                brick: "no-op",
              },
            ],
          },
        ],
      ])
    );
    const nodesWithDelegatedSlots = result.nodes.filter(
      (node) => node.$$delegatedSlots
    );
    expect(nodesWithDelegatedSlots.length).toBe(1);
    expect(nodesWithDelegatedSlots[0]).toMatchObject({
      id: "TB-c",
      $$delegatedSlots: new Map([
        [
          "t",
          [
            {
              templateUid: 1000,
              templateMountPoint: "beforeTopContent",
            },
          ],
        ],
        [
          "c",
          [
            {
              templateUid: 1000,
              templateMountPoint: "centerContent",
            },
          ],
        ],
        [
          "b",
          [
            {
              templateUid: 1000,
              templateMountPoint: "beforeBottomContent",
            },
            {
              templateUid: 1000,
              templateMountPoint: "afterBottomContent",
            },
          ],
        ],
      ]),
    });
  });

  it("should work when root is a route of bricks", () => {
    const result = getAppendingNodesAndEdges(
      {
        id: "R-1",
        type: "bricks",
        path: "/",
        children: [
          {
            id: "B-1",
            type: "brick",
            brick: "general-graph",
          },
        ],
      },
      1000,
      undefined
    );
    expect(result).toEqual({
      nodes: [
        expect.objectContaining({
          $$uid: 1000,
          type: "bricks",
          id: "R-1",
          $$isTemplateInternalNode: undefined,
        }),
        expect.objectContaining({
          $$uid: 1,
          id: "B-1",
          $$isTemplateInternalNode: undefined,
        }),
      ],
      edges: [
        expect.objectContaining({
          parent: 1000,
          child: 1,
          mountPoint: "bricks",
          $$isTemplateInternal: undefined,
          $$isTemplateDelegated: undefined,
        }),
      ],
    });
  });

  it("should work when root is a route of routes", () => {
    const result = getAppendingNodesAndEdges(
      {
        id: "R-1",
        type: "routes",
        path: "/",
        children: [
          {
            id: "R-2",
            type: "routes",
            path: "/2",
          },
        ],
      },
      1000,
      undefined
    );
    expect(result).toEqual({
      nodes: [
        expect.objectContaining({
          $$uid: 1000,
          type: "routes",
          id: "R-1",
          $$isTemplateInternalNode: undefined,
        }),
        expect.objectContaining({
          $$uid: 1,
          id: "R-2",
          $$isTemplateInternalNode: undefined,
        }),
      ],
      edges: [
        expect.objectContaining({
          parent: 1000,
          child: 1,
          mountPoint: "routes",
          $$isTemplateInternal: undefined,
          $$isTemplateDelegated: undefined,
        }),
      ],
    });
  });

  it("should work when first child was wrapper", () => {
    const result = getAppendingNodesAndEdges(
      {
        id: "B-001",
        type: "bricks",
        path: "/page-1",
        mountPoint: "routes",
        children: [
          {
            id: "B-002",
            type: "brick",
            brick: "tpl-page-wrapper-theme",
            mountPoint: "bricks",
          },
        ],
      },
      1000,
      templateSourceMap,
      [],
      true
    );

    expect(result).toMatchInlineSnapshot(`
      Object {
        "edges": Array [
          Object {
            "$$isTemplateInternal": true,
            "child": 4,
            "mountPoint": "",
            "parent": 3,
            "sort": 0,
          },
          Object {
            "$$isTemplateDelegated": undefined,
            "$$isTemplateInternal": true,
            "child": 3,
            "mountPoint": "header",
            "parent": 2,
            "sort": 0,
          },
          Object {
            "$$isTemplateInternal": true,
            "child": 2,
            "mountPoint": "",
            "parent": 1,
            "sort": 0,
          },
          Object {
            "$$isTemplateDelegated": undefined,
            "$$isTemplateInternal": undefined,
            "child": 1,
            "mountPoint": "bricks",
            "parent": 1000,
            "sort": 0,
          },
        ],
        "nodes": Array [
          Object {
            "$$isTemplateInternalNode": undefined,
            "$$matchedSelectors": Array [],
            "$$normalized": Object {
              "path": "/page-1",
              "type": "bricks",
            },
            "$$parsedEvents": Object {},
            "$$parsedLifeCycle": Object {},
            "$$parsedProperties": Object {},
            "$$uid": 1000,
            "$$unreachable": false,
            "alias": undefined,
            "id": "B-001",
            "path": "/page-1",
            "type": "bricks",
          },
          Object {
            "$$isExpandableTemplate": true,
            "$$isTemplateInternalNode": undefined,
            "$$matchedSelectors": Array [
              "tpl-page-wrapper-theme",
            ],
            "$$normalized": Object {
              "brick": "tpl-page-wrapper-theme",
            },
            "$$parsedEvents": Object {},
            "$$parsedLifeCycle": Object {},
            "$$parsedProperties": Object {},
            "$$templateProxy": Object {
              "properties": Object {
                "easyTitle": Object {
                  "ref": "pageTitle",
                  "refProperty": "pageTitle",
                },
              },
              "slots": Object {
                "content": Object {
                  "ref": "easyView",
                  "refSlot": "content",
                },
              },
            },
            "$$templateRefToUid": Map {
              "easyView" => 2,
              "pageTitle" => 3,
            },
            "$$uid": 1,
            "$$unreachable": false,
            "alias": "tpl-page-wrapper-theme",
            "brick": "tpl-page-wrapper-theme",
            "id": "B-002",
            "layoutType": "wrapper",
            "type": "brick",
          },
          Object {
            "$$delegatedSlots": Map {
              "content" => Array [
                Object {
                  "templateMountPoint": "content",
                  "templateUid": 1,
                },
              ],
            },
            "$$isTemplateInternalNode": true,
            "$$matchedSelectors": Array [
              "basic-bricks\\\\.easy-view",
            ],
            "$$normalized": Object {
              "brick": "basic-bricks.easy-view",
              "ref": "easyView",
            },
            "$$parsedEvents": Object {},
            "$$parsedLifeCycle": Object {},
            "$$parsedProperties": Object {},
            "$$uid": 2,
            "$$unreachable": false,
            "alias": "easyView",
            "brick": "basic-bricks.easy-view",
            "id": "TT-1",
            "ref": "easyView",
            "type": "brick",
          },
          Object {
            "$$isExpandableTemplate": true,
            "$$isTemplateInternalNode": true,
            "$$matchedSelectors": Array [
              "tpl-page-wrapper-theme-1",
            ],
            "$$normalized": Object {
              "brick": "tpl-page-wrapper-theme-1",
              "properties": Object {
                "any": "value",
              },
              "ref": "pageTitle",
            },
            "$$parsedEvents": Object {},
            "$$parsedLifeCycle": Object {},
            "$$parsedProperties": Object {
              "any": "value",
            },
            "$$templateProxy": undefined,
            "$$templateRefToUid": Map {},
            "$$uid": 3,
            "$$unreachable": false,
            "alias": "pageTitle",
            "brick": "tpl-page-wrapper-theme-1",
            "id": "TT-2",
            "layoutType": "wrapper",
            "properties": "{\\"any\\":\\"value\\"}",
            "ref": "pageTitle",
            "type": "brick",
          },
          Object {
            "$$isTemplateInternalNode": true,
            "$$matchedSelectors": Array [
              "basic-bricks\\\\.general-button",
            ],
            "$$normalized": Object {
              "brick": "basic-bricks.general-button",
            },
            "$$parsedEvents": Object {},
            "$$parsedLifeCycle": Object {},
            "$$parsedProperties": Object {},
            "$$uid": 4,
            "$$unreachable": false,
            "alias": "general-button",
            "brick": "basic-bricks.general-button",
            "id": "TT-3",
            "type": "brick",
          },
        ],
        "wrapperNode": Object {
          "$$isExpandableTemplate": true,
          "$$isTemplateInternalNode": undefined,
          "$$matchedSelectors": Array [
            "tpl-page-wrapper-theme",
          ],
          "$$normalized": Object {
            "brick": "tpl-page-wrapper-theme",
          },
          "$$parsedEvents": Object {},
          "$$parsedLifeCycle": Object {},
          "$$parsedProperties": Object {},
          "$$templateProxy": Object {
            "properties": Object {
              "easyTitle": Object {
                "ref": "pageTitle",
                "refProperty": "pageTitle",
              },
            },
            "slots": Object {
              "content": Object {
                "ref": "easyView",
                "refSlot": "content",
              },
            },
          },
          "$$templateRefToUid": Map {
            "easyView" => 2,
            "pageTitle" => 3,
          },
          "$$uid": 1,
          "$$unreachable": false,
          "alias": "tpl-page-wrapper-theme",
          "brick": "tpl-page-wrapper-theme",
          "id": "B-002",
          "layoutType": "wrapper",
          "type": "brick",
        },
      }
    `);
  });
});
