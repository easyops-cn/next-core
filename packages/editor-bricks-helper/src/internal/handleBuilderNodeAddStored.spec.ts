import { range } from "lodash";
import { BuilderRouteOrBrickNode } from "@easyops/brick-types";
import { handleBuilderNodeAddStored } from "./handleBuilderNodeAddStored";
import { getCachedCanvasData, setCachedCanvasData } from "./cachedCanvasData";
import { BuilderRuntimeNode } from "../interfaces";

describe("handleBuilderNodeAddStored", () => {
  beforeEach(() => {
    setCachedCanvasData({
      rootId: 1,
      nodes: range(1, 3).map(
        ($$uid) =>
          (({
            $$uid,
          } as Partial<BuilderRuntimeNode>) as BuilderRuntimeNode)
      ),
      edges: [],
    });
  });

  it("should work", () => {
    handleBuilderNodeAddStored({
      nodeUid: 2,
      nodeAlias: "new-brick",
      nodeData: ({
        id: "B-003",
      } as Partial<BuilderRouteOrBrickNode>) as BuilderRouteOrBrickNode,
    });
    expect(getCachedCanvasData()).toMatchInlineSnapshot(`
      Object {
        "edges": Array [],
        "nodes": Array [
          Object {
            "$$uid": 1,
          },
          Object {
            "$$uid": 2,
            "alias": "new-brick",
            "id": "B-003",
          },
        ],
        "rootId": 1,
      }
    `);
  });
});
