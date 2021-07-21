import { deepFreeze } from "@next-core/brick-utils";
import { BuilderCanvasData } from "../interfaces";
import { expandTemplateEdges } from "./expandTemplateEdges";

describe("expandTemplateEdges", () => {
  it("should work for nested templates", () => {
    const data: BuilderCanvasData = deepFreeze({
      nodes: [
        {
          id: "B-1",
          type: "brick",
          brick: "tpl-micro-view",
          $$uid: 1000,
          $$isTemplateInternalNode: undefined,
          $$isExpandableTemplate: true,
          $$templateProxy: {
            slots: {
              toolbar: { ref: "microView", refSlot: "toolbar" },
              beforeContent: { ref: "microView", refSlot: "beforeContent" },
            },
          },
          $$templateRefToUid: new Map([
            ["microView", 1],
            ["generalTable", 4],
          ]),
        },
        {
          id: "TB-1",
          type: "brick",
          brick: "tpl-easy-view",
          mountPoint: "bricks",
          ref: "microView",
          $$uid: 1,
          $$isTemplateInternalNode: true,
          $$isExpandableTemplate: true,
          $$templateProxy: {
            slots: {
              beforeContent: {
                ref: "easyView",
                refSlot: "content",
                refPosition: 0,
              },
              content: { ref: "easyView", refSlot: "content" },
            },
          },
          $$templateRefToUid: new Map([
            ["easyView", 2],
            ["pageTitle", 3],
          ]),
        },
        {
          id: "TB-3",
          type: "brick",
          brick: "basic-bricks.easy-view",
          mountPoint: "bricks",
          ref: "easyView",
          $$uid: 2,
          $$isTemplateInternalNode: true,
        },
        {
          id: "TB-4",
          type: "brick",
          brick: "basic-bricks.page-title",
          ref: "pageTitle",
          mountPoint: "header",
          $$uid: 3,
          $$isTemplateInternalNode: true,
        },
        {
          id: "TB-2",
          type: "brick",
          brick: "basic-bricks.general-table",
          ref: "generalTable",
          mountPoint: "content",
          $$uid: 4,
          $$isTemplateInternalNode: true,
        },
        {
          id: "B-2",
          type: "brick",
          brick: "general-button",
          mountPoint: "toolbar",
          $$uid: 5,
          $$isTemplateInternalNode: undefined,
        },
        {
          id: "B-3",
          type: "brick",
          brick: "general-input",
          mountPoint: "beforeContent",
          $$uid: 6,
          $$isTemplateInternalNode: undefined,
        },
      ],
      edges: [
        {
          parent: 2,
          child: 3,
          $$isTemplateInternal: true,
          $$isTemplateDelegated: undefined,
          mountPoint: "header",
          sort: 0,
        },
        {
          parent: 1,
          child: 2,
          $$isTemplateInternal: true,
          mountPoint: "",
          sort: 0,
        },
        {
          parent: 1,
          child: 4,
          $$isTemplateInternal: true,
          $$isTemplateDelegated: true,
          mountPoint: "content",
          sort: 1,
        },
        {
          parent: 1000,
          child: 1,
          $$isTemplateInternal: true,
          mountPoint: "",
          sort: 0,
        },
        {
          parent: 1000,
          child: 5,
          $$isTemplateInternal: undefined,
          $$isTemplateDelegated: true,
          mountPoint: "toolbar",
          sort: 1,
        },
        {
          parent: 1000,
          child: 6,
          $$isTemplateInternal: undefined,
          $$isTemplateDelegated: true,
          mountPoint: "beforeContent",
          sort: 2,
        },
      ],
      rootId: 1000,
    });
    const result = expandTemplateEdges(data);
    expect(result).toEqual([
      expect.objectContaining({
        parent: 2,
        child: 3,
        mountPoint: "header",
        sort: 1,
      }),
      expect.objectContaining({
        parent: 1,
        child: 2,
        mountPoint: "",
        sort: 0,
      }),
      expect.objectContaining({
        parent: 1,
        child: 4,
        mountPoint: "content",
        sort: 1,
      }),
      expect.objectContaining({
        parent: 1000,
        child: 1,
        mountPoint: "",
        sort: 0,
      }),
      expect.objectContaining({
        parent: 1000,
        child: 5,
        mountPoint: "toolbar",
        sort: 1,
      }),
      expect.objectContaining({
        parent: 1000,
        child: 6,
        mountPoint: "beforeContent",
        sort: 2,
      }),
      expect.objectContaining({
        parent: 2,
        child: 6,
        mountPoint: "content",
        sort: 0,
        $$isTemplateExpanded: true,
      }),
      expect.objectContaining({
        parent: 2,
        child: 4,
        mountPoint: "content",
        sort: 2,
        $$isTemplateExpanded: true,
      }),
    ]);
  });

  it("should return original edges if no expansions were taken", () => {
    const data: BuilderCanvasData = deepFreeze({
      nodes: [
        {
          $$uid: 1000,
          id: "B-1",
          type: "brick",
          brick: "micro-view",
        },
        {
          $$uid: 1,
          id: "B-2",
          type: "brick",
          brick: "general-button",
        },
      ],
      edges: [
        {
          parent: 1000,
          child: 1,
          mountPoint: "toolbar",
          sort: 0,
        },
      ],
      rootId: 1000,
    });
    expect(expandTemplateEdges(data)).toBe(data.edges);
  });
});
