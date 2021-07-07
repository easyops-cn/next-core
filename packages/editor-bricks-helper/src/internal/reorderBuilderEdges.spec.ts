import { BuilderRuntimeNode } from "../interfaces";
import { reorderBuilderEdges } from "./reorderBuilderEdges";

describe("reorderBuilderEdges", () => {
  it("should work", () => {
    expect(
      reorderBuilderEdges(
        {
          rootId: 100,
          nodes: [
            {
              $$uid: 100,
            },
            {
              $$uid: 1,
            },
            {
              $$uid: 2,
            },
            {
              $$uid: 3,
            },
            {
              $$uid: 4,
            },
            {
              $$uid: 101,
            },
          ] as Partial<BuilderRuntimeNode>[] as BuilderRuntimeNode[],
          edges: [
            {
              parent: 100,
              child: 1,
              mountPoint: "bricks",
              sort: 0,
            },
            {
              parent: 100,
              child: 101,
              mountPoint: "bricks",
              sort: 1,
            },
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
        },
        {
          parentUid: 1,
          nodeUids: [3, 2, 4],
        }
      )
    ).toEqual([
      {
        parent: 100,
        child: 1,
        mountPoint: "bricks",
        sort: 0,
      },
      {
        parent: 100,
        child: 101,
        mountPoint: "bricks",
        sort: 1,
      },
      {
        parent: 1,
        child: 2,
        mountPoint: "toolbar",
        sort: 1,
      },
      {
        parent: 1,
        child: 3,
        mountPoint: "toolbar",
        sort: 0,
      },
      {
        parent: 1,
        child: 4,
        mountPoint: "content",
        sort: 2,
      },
    ]);
  });
});
