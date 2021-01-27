import { BuilderCanvasData } from "../interfaces";
import { deleteNodeFromTree } from "./deleteNodeFromTree";

// Given a tree:
//       1
//      ↙ ↘
//     2   3
//       ↙   ↘
// (content) (toolbar)
//    ↙ ↘        ↓
//   4   6       5
describe("deleteNodeFromTree", () => {
  const data: BuilderCanvasData = {
    edges: [
      {
        child: 2,
        mountPoint: "bricks",
        parent: 1,
        sort: 0,
      },
      {
        child: 4,
        mountPoint: "content",
        parent: 3,
        sort: 0,
      },
      {
        child: 5,
        mountPoint: "toolbar",
        parent: 3,
        sort: 1,
      },
      {
        child: 6,
        mountPoint: "content",
        parent: 3,
        sort: 2,
      },
      {
        child: 3,
        mountPoint: "bricks",
        parent: 1,
        sort: 1,
      },
    ],
    nodes: [
      {
        $$parsedProperties: {},
        $$uid: 1,
        id: "B-001",
        path: "/home",
        type: "bricks",
      },
      {
        $$parsedProperties: {},
        $$uid: 2,
        alias: "alias-a",
        brick: "brick-a",
        id: "B-002",
        sort: 0,
        type: "brick",
      },
      {
        $$parsedProperties: {},
        $$uid: 3,
        brick: "brick-b",
        id: "B-003",
        sort: 1,
        type: "brick",
      },
      {
        $$parsedProperties: {},
        $$uid: 4,
        brick: "brick-c",
        id: "B-004",
        type: "brick",
      },
      {
        $$parsedProperties: {},
        $$uid: 5,
        brick: "brick-d",
        id: "B-005",
        type: "brick",
      },
      {
        $$parsedProperties: {},
        $$uid: 6,
        brick: "brick-e",
        id: "B-006",
        sort: 1,
        type: "brick",
      },
    ],
    rootId: 1,
  };

  it.each<[number, number[], string[]]>([
    [2, [1, 3, 4, 5, 6], ["1:3", "3:4", "3:5", "3:6"]],
    [3, [1, 2], ["1:2"]],
    [4, [1, 2, 3, 5, 6], ["1:2", "1:3", "3:5", "3:6"]],
  ])("should delete node %s", (idTodDelete, resultNodes, resultEdges) => {
    const result = deleteNodeFromTree(idTodDelete, data);
    expect(result.rootId).toBe(1);
    expect(result.nodes.map((node) => node.$$uid).sort()).toEqual(resultNodes);
    expect(
      result.edges.map((edge) => `${edge.parent}:${edge.child}`).sort()
    ).toEqual(resultEdges);
  });
});
