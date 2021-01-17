import { BuilderRouteOrBrickNode } from "@easyops/brick-types";
import { NodeInstance } from "../interfaces";
import { BuilderDataManager as BuilderDataManagerType } from "./BuilderDataManager";

// Given a tree:
//       1
//      ↙ ↘
//     2   3
//       ↙   ↘
// (content) (toolbar)
//    ↙ ↘        ↓
//   4   6       5
describe("BuilderDataManager", () => {
  let manager: BuilderDataManagerType;
  let BuilderDataManager: typeof BuilderDataManagerType;

  beforeEach(() => {
    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    BuilderDataManager = require("./BuilderDataManager").BuilderDataManager;
    manager = new BuilderDataManager();
    manager.dataInit({
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
              id: "B-006",
              type: "brick",
              brick: "brick-e",
              sort: 1,
              mountPoint: "content",
            },
            {
              id: "B-005",
              type: "brick",
              brick: "brick-d",
              mountPoint: "toolbar",
            },
          ],
        },
      ],
    });
  });

  it("should init data", () => {
    expect(manager.getData()).toMatchInlineSnapshot(`
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
            "parsedProperties": Object {},
            "path": "/home",
            "type": "bricks",
          },
          Object {
            "$$uid": 2,
            "alias": "alias-a",
            "brick": "brick-a",
            "id": "B-002",
            "parsedProperties": Object {},
            "sort": 0,
            "type": "brick",
          },
          Object {
            "$$uid": 3,
            "alias": undefined,
            "brick": "brick-b",
            "id": "B-003",
            "parsedProperties": Object {},
            "sort": 1,
            "type": "brick",
          },
          Object {
            "$$uid": 4,
            "alias": undefined,
            "brick": "brick-c",
            "id": "B-004",
            "parsedProperties": Object {},
            "type": "brick",
          },
          Object {
            "$$uid": 5,
            "alias": undefined,
            "brick": "brick-d",
            "id": "B-005",
            "parsedProperties": Object {},
            "type": "brick",
          },
          Object {
            "$$uid": 6,
            "alias": undefined,
            "brick": "brick-e",
            "id": "B-006",
            "parsedProperties": Object {},
            "sort": 1,
            "type": "brick",
          },
        ],
        "rootId": 1,
      }
    `);
  });

  it("should add node", () => {
    const listenOnNodeAdd = jest.fn();
    const listenOnDataChange = jest.fn();
    const unlistenOnNodeAdd = manager.onNodeAdd(listenOnNodeAdd);
    const unlistenOnDataChange = manager.onDataChange(listenOnDataChange);
    manager.nodeAdd({
      nodeUid: 7,
      parentUid: 3,
      nodeUids: [4, 6, 7, 5],
      nodeAlias: "new-brick",
      nodeData: ({
        mountPoint: "toolbar",
      } as Partial<NodeInstance>) as NodeInstance,
      nodeIds: null,
    });
    const newData = manager.getData();
    expect(newData.edges).toMatchInlineSnapshot(`
      Array [
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
          "sort": 3,
        },
        Object {
          "child": 6,
          "mountPoint": "content",
          "parent": 3,
          "sort": 1,
        },
        Object {
          "child": 3,
          "mountPoint": "bricks",
          "parent": 1,
          "sort": 1,
        },
        Object {
          "child": 7,
          "mountPoint": "toolbar",
          "parent": 3,
          "sort": 2,
        },
      ]
    `);
    expect(newData.nodes[newData.nodes.length - 1]).toMatchInlineSnapshot(`
      Object {
        "$$uid": 7,
        "alias": "new-brick",
        "parsedProperties": Object {},
      }
    `);
    expect(listenOnNodeAdd).toBeCalled();
    expect(listenOnDataChange).toBeCalled();
    unlistenOnNodeAdd();
    unlistenOnDataChange();
  });

  it("should update stored node", () => {
    const listenOnDataChange = jest.fn();
    const unlistenOnDataChange = manager.onDataChange(listenOnDataChange);
    manager.nodeAdd({
      nodeUid: 7,
      parentUid: 3,
      nodeUids: [4, 6, 7, 5],
      nodeAlias: "new-brick",
      nodeData: ({
        mountPoint: "toolbar",
      } as Partial<NodeInstance>) as NodeInstance,
      nodeIds: null,
    });
    manager.nodeAddStored({
      nodeUid: 7,
      nodeAlias: "new-brick",
      nodeData: ({
        id: "B-007",
      } as Partial<BuilderRouteOrBrickNode>) as BuilderRouteOrBrickNode,
    });
    expect(manager.getData().nodes.find((node) => node.$$uid === 7).id).toBe(
      "B-007"
    );
    expect(listenOnDataChange).toBeCalled();
    unlistenOnDataChange();
  });

  it("should move nodes inside a mount point", () => {
    const listenOnNodeMove = jest.fn();
    const listenOnDataChange = jest.fn();
    const unlistenOnNodeMove = manager.onNodeMove(listenOnNodeMove);
    const unlistenOnDataChange = manager.onDataChange(listenOnDataChange);
    manager.nodeMove({
      nodeUid: 6,
      parentUid: 3,
      nodeUids: [6, 4, 5],
      nodeData: {
        mountPoint: "content",
        parent: "any-parent",
      },
      nodeIds: null,
      nodeInstanceId: null,
    });
    expect(manager.getData().edges).toMatchInlineSnapshot(`
      Array [
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
          "sort": 1,
        },
        Object {
          "child": 5,
          "mountPoint": "toolbar",
          "parent": 3,
          "sort": 2,
        },
        Object {
          "child": 3,
          "mountPoint": "bricks",
          "parent": 1,
          "sort": 1,
        },
        Object {
          "child": 6,
          "mountPoint": "content",
          "parent": 3,
          "sort": 0,
        },
      ]
    `);
    expect(listenOnNodeMove).toBeCalled();
    expect(listenOnDataChange).toBeCalled();
    unlistenOnNodeMove();
    unlistenOnDataChange();
  });

  it("should move nodes across mount points", () => {
    const listenOnNodeMove = jest.fn();
    const listenOnDataChange = jest.fn();
    const unlistenOnNodeMove = manager.onNodeMove(listenOnNodeMove);
    const unlistenOnDataChange = manager.onDataChange(listenOnDataChange);
    manager.nodeMove({
      nodeUid: 5,
      parentUid: 3,
      nodeUids: [4, 5, 6],
      nodeData: {
        mountPoint: "content",
        parent: "any-parent",
      },
      nodeIds: null,
      nodeInstanceId: null,
    });
    expect(manager.getData().edges).toMatchInlineSnapshot(`
      Array [
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
        Object {
          "child": 5,
          "mountPoint": "content",
          "parent": 3,
          "sort": 1,
        },
      ]
    `);
    expect(listenOnNodeMove).toBeCalled();
    expect(listenOnDataChange).toBeCalled();
    unlistenOnNodeMove();
    unlistenOnDataChange();
  });

  it("should reorder nodes", () => {
    const listenOnNodeReorder = jest.fn();
    const listenOnDataChange = jest.fn();
    const unlistenOnNodeReorder = manager.onNodeReorder(listenOnNodeReorder);
    const unlistenOnDataChange = manager.onDataChange(listenOnDataChange);
    manager.nodeReorder({
      parentUid: 1,
      nodeUids: [3, 2],
      nodeIds: null,
    });
    expect(manager.getData().edges).toMatchInlineSnapshot(`
      Array [
        Object {
          "child": 2,
          "mountPoint": "bricks",
          "parent": 1,
          "sort": 1,
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
          "sort": 0,
        },
      ]
    `);
    expect(listenOnNodeReorder).toBeCalled();
    expect(listenOnDataChange).toBeCalled();
    unlistenOnNodeReorder();
    unlistenOnDataChange();
  });

  it("should trigger node click", () => {
    const listenOnNodeClick = jest.fn();
    const unlisten = manager.onNodeClick(listenOnNodeClick);
    manager.nodeClick({
      type: "brick",
      id: "B-001",
      brick: "my-brick",
    });
    expect(listenOnNodeClick).toBeCalled();
    unlisten();
  });

  it("should change context menu", () => {
    const listenOnContextMenuChange = jest.fn();
    const unlisten = manager.onContextMenuChange(listenOnContextMenuChange);
    expect(manager.getContextMenuStatus()).toEqual({
      active: false,
    });
    manager.contextMenuChange({
      active: true,
    });
    expect(manager.getContextMenuStatus()).toEqual({
      active: true,
    });
    expect(listenOnContextMenuChange).toBeCalled();
    unlisten();
  });
});
