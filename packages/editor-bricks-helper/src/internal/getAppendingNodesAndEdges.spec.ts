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
});
