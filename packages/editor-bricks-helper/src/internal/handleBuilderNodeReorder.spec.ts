import { handleBuilderNodeReorder } from "./handleBuilderNodeReorder";
import { getCachedCanvasData, setCachedCanvasData } from "./cachedCanvasData";

describe("handleBuilderNodeReorder", () => {
  beforeEach(() => {
    setCachedCanvasData({
      rootId: 1,
      nodes: [],
      edges: [
        {
          parent: 1,
          child: 2,
          mountPoint: "toolbar",
          sort: 0,
        },
        {
          parent: 1,
          child: 3,
          mountPoint: "toolbar",
          sort: 1,
        },
        {
          parent: 1,
          child: 4,
          mountPoint: "content",
          sort: 0,
        },
      ],
    });
  });

  it("should move nodes inside a mount point", () => {
    handleBuilderNodeReorder({
      parentUid: 1,
      nodeUids: [3, 2],
      mountPoint: "toolbar",
      nodeIds: null,
    });
    expect(getCachedCanvasData()).toMatchInlineSnapshot(`
      Object {
        "edges": Array [
          Object {
            "child": 2,
            "mountPoint": "toolbar",
            "parent": 1,
            "sort": 1,
          },
          Object {
            "child": 3,
            "mountPoint": "toolbar",
            "parent": 1,
            "sort": 0,
          },
          Object {
            "child": 4,
            "mountPoint": "content",
            "parent": 1,
            "sort": 0,
          },
        ],
        "nodes": Array [],
        "rootId": 1,
      }
    `);
  });
});
