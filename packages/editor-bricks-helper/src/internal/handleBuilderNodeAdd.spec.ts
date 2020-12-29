import { range } from "lodash";
import { handleBuilderNodeAdd } from "./handleBuilderNodeAdd";
import { getCachedCanvasData, setCachedCanvasData } from "./cachedCanvasData";
import { BuilderRuntimeNode, NodeInstance } from "../interfaces";

describe("handleBuilderNodeAdd", () => {
  beforeEach(() => {
    setCachedCanvasData({
      rootId: 1,
      nodes: range(1, 5).map(
        ($$uid) =>
          (({
            $$uid,
          } as Partial<BuilderRuntimeNode>) as BuilderRuntimeNode)
      ),
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

  it("should work", () => {
    handleBuilderNodeAdd({
      nodeUid: 5,
      parentUid: 1,
      nodeUids: [2, 5, 3],
      nodeAlias: "new-brick",
      nodeData: ({
        mountPoint: "toolbar",
      } as Partial<NodeInstance>) as NodeInstance,
      nodeIds: null,
    });
    expect(getCachedCanvasData()).toMatchInlineSnapshot(`
      Object {
        "edges": Array [
          Object {
            "child": 2,
            "mountPoint": "toolbar",
            "parent": 1,
            "sort": 0,
          },
          Object {
            "child": 3,
            "mountPoint": "toolbar",
            "parent": 1,
            "sort": 2,
          },
          Object {
            "child": 4,
            "mountPoint": "content",
            "parent": 1,
            "sort": 0,
          },
          Object {
            "child": 5,
            "mountPoint": "toolbar",
            "parent": 1,
            "sort": 1,
          },
        ],
        "nodes": Array [
          Object {
            "$$uid": 1,
          },
          Object {
            "$$uid": 2,
          },
          Object {
            "$$uid": 3,
          },
          Object {
            "$$uid": 4,
          },
          Object {
            "$$uid": 5,
            "alias": "new-brick",
            "mountPoint": "toolbar",
          },
        ],
        "rootId": 1,
      }
    `);
  });
});
