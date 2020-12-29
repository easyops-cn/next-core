import { handleBuilderDataInit } from "./handleBuilderDataInit";
import { getCachedCanvasData } from "./cachedCanvasData";

describe("handleBuilderDataInit", () => {
  it("should work", () => {
    handleBuilderDataInit({
      id: "B-001",
      type: "bricks",
      path: "/home",
      children: [
        {
          id: "B-002",
          type: "brick",
          brick: "brick-a",
          sort: 0,
          mountPoint: "bricks",
          alias: "alias-a",
        },
        {
          id: "B-003",
          type: "brick",
          brick: "brick-b",
          sort: 1,
          mountPoint: "bricks",
          children: [
            {
              id: "B-004",
              type: "brick",
              brick: "brick-c",
              mountPoint: "content",
            },
            {
              id: "B-005",
              type: "brick",
              brick: "brick-d",
              sort: 1,
              mountPoint: "content",
            },
            {
              id: "B-006",
              type: "brick",
              brick: "brick-d",
              mountPoint: "toolbar",
            },
          ],
        },
      ],
    });
    expect(getCachedCanvasData()).toMatchInlineSnapshot(`
      Object {
        "edges": Array [
          Object {
            "child": 2,
            "mountPoint": "bricks",
            "parent": 1,
            "sort": 0,
          },
          Object {
            "child": 4,
            "mountPoint": "content",
            "parent": 3,
            "sort": 0,
          },
          Object {
            "child": 5,
            "mountPoint": "toolbar",
            "parent": 3,
            "sort": 1,
          },
          Object {
            "child": 6,
            "mountPoint": "content",
            "parent": 3,
            "sort": 2,
          },
          Object {
            "child": 3,
            "mountPoint": "bricks",
            "parent": 1,
            "sort": 1,
          },
        ],
        "nodes": Array [
          Object {
            "$$uid": 1,
            "alias": undefined,
            "id": "B-001",
            "path": "/home",
            "type": "bricks",
          },
          Object {
            "$$uid": 2,
            "alias": "alias-a",
            "brick": "brick-a",
            "id": "B-002",
            "sort": 0,
            "type": "brick",
          },
          Object {
            "$$uid": 3,
            "alias": undefined,
            "brick": "brick-b",
            "id": "B-003",
            "sort": 1,
            "type": "brick",
          },
          Object {
            "$$uid": 4,
            "alias": undefined,
            "brick": "brick-c",
            "id": "B-004",
            "type": "brick",
          },
          Object {
            "$$uid": 5,
            "alias": undefined,
            "brick": "brick-d",
            "id": "B-006",
            "type": "brick",
          },
          Object {
            "$$uid": 6,
            "alias": undefined,
            "brick": "brick-d",
            "id": "B-005",
            "sort": 1,
            "type": "brick",
          },
        ],
        "rootId": 1,
      }
    `);
  });
});
