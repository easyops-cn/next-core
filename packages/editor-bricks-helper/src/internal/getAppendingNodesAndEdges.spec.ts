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
      proxy: '{"slots":{"toolbar":{"ref":"microView","refSlot":"toolbar"}}}',
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
      proxy: '{"slots":{"content":{"ref":"easyView","refSlot":"content"}}}',
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
          },
        }),
        expect.objectContaining({
          $$uid: 1,
          id: "TB-3",
          $$isTemplateInternalNode: true,
        }),
        expect.objectContaining({
          $$uid: 2,
          id: "TB-4",
          $$isTemplateInternalNode: true,
        }),
        expect.objectContaining({
          $$uid: 3,
          id: "B-2",
          $$isTemplateInternalNode: undefined,
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
          },
        }),
        expect.objectContaining({
          $$uid: 1,
          id: "TB-1",
          $$isTemplateInternalNode: true,
          $$isExpandableTemplate: true,
          $$templateProxy: {
            slots: { content: { ref: "easyView", refSlot: "content" } },
          },
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
          $$isTemplateInternalNode: true,
        }),
        expect.objectContaining({
          $$uid: 5,
          id: "B-2",
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
  });

  it("should work when root is a custom-template", () => {
    const result = getAppendingNodesAndEdges(
      {
        id: "T-1",
        templateId: "tpl-micro-view",
        type: "custom-template",
        proxy: '{"slots":{"toolbar":{"ref":"microView","refSlot":"toolbar"}}}',
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
