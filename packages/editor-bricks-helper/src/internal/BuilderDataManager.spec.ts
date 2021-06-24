import {
  BuilderRouteOrBrickNode,
  Story,
  StoryDoc,
} from "@next-core/brick-types";
import { NodeInstance } from "../interfaces";
import { BuilderDataManager as BuilderDataManagerType } from "./BuilderDataManager";

// Given a tree:
//       1 <route>
//      ↙ ↘
//     2   3
//       ↙   ↘
// (content) (toolbar)
//    ↙ ↘        ↓
//   4   6       5
describe("BuilderDataManager for route of bricks", () => {
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
          mountPoint: "undefined",
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
            "$$matchedSelectors": Array [],
            "$$parsedEvents": Object {},
            "$$parsedLifeCycle": Object {},
            "$$parsedProperties": Object {},
            "$$parsedProxy": Object {},
            "$$uid": 1,
            "alias": undefined,
            "id": "B-001",
            "path": "/home",
            "type": "bricks",
          },
          Object {
            "$$matchedSelectors": Array [
              "brick-a",
            ],
            "$$parsedEvents": Object {},
            "$$parsedLifeCycle": Object {},
            "$$parsedProperties": Object {},
            "$$parsedProxy": Object {},
            "$$uid": 2,
            "alias": "alias-a",
            "brick": "brick-a",
            "id": "B-002",
            "sort": 0,
            "type": "brick",
          },
          Object {
            "$$matchedSelectors": Array [
              "brick-b",
            ],
            "$$parsedEvents": Object {},
            "$$parsedLifeCycle": Object {},
            "$$parsedProperties": Object {},
            "$$parsedProxy": Object {},
            "$$uid": 3,
            "alias": "brick-b",
            "brick": "brick-b",
            "id": "B-003",
            "sort": 1,
            "type": "brick",
          },
          Object {
            "$$matchedSelectors": Array [
              "brick-c",
            ],
            "$$parsedEvents": Object {},
            "$$parsedLifeCycle": Object {},
            "$$parsedProperties": Object {},
            "$$parsedProxy": Object {},
            "$$uid": 4,
            "alias": "brick-c",
            "brick": "brick-c",
            "id": "B-004",
            "type": "brick",
          },
          Object {
            "$$matchedSelectors": Array [
              "brick-d",
            ],
            "$$parsedEvents": Object {},
            "$$parsedLifeCycle": Object {},
            "$$parsedProperties": Object {},
            "$$parsedProxy": Object {},
            "$$uid": 5,
            "alias": "brick-d",
            "brick": "brick-d",
            "id": "B-005",
            "type": "brick",
          },
          Object {
            "$$matchedSelectors": Array [
              "brick-e",
            ],
            "$$parsedEvents": Object {},
            "$$parsedLifeCycle": Object {},
            "$$parsedProperties": Object {},
            "$$parsedProxy": Object {},
            "$$uid": 6,
            "alias": "brick-e",
            "brick": "brick-e",
            "id": "B-006",
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
      nodeData: {
        type: "brick",
        brick: "my.any-brick",
        mountPoint: "toolbar",
      } as Partial<NodeInstance> as NodeInstance,
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
        "$$matchedSelectors": Array [
          "my\\\\.any-brick",
        ],
        "$$parsedEvents": Object {},
        "$$parsedLifeCycle": Object {},
        "$$parsedProperties": Object {},
        "$$parsedProxy": Object {},
        "$$uid": 7,
        "alias": "any-brick",
        "brick": "my.any-brick",
        "type": "brick",
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
      nodeData: {
        mountPoint: "toolbar",
      } as Partial<NodeInstance> as NodeInstance,
      nodeIds: null,
    });
    manager.nodeAddStored({
      nodeUid: 7,
      nodeData: {
        id: "B-007",
      } as Partial<BuilderRouteOrBrickNode> as BuilderRouteOrBrickNode,
    });
    expect(manager.getData().nodes.find((node) => node.$$uid === 7).id).toBe(
      "B-007"
    );
    expect(listenOnDataChange).toBeCalled();
    unlistenOnDataChange();
  });

  it("should apply snippet", () => {
    const listenOnSnippetApply = jest.fn();
    const listenOnDataChange = jest.fn();
    const unlistenOnSnippetApply = manager.onSnippetApply(listenOnSnippetApply);
    const unlistenOnDataChange = manager.onDataChange(listenOnDataChange);
    manager.snippetApply({
      parentUid: 3,
      nodeUids: [4, 6, 7, 5],
      nodeIds: null,
      nodeDetails: [
        {
          nodeUid: 7,
          parentUid: 3,
          nodeData: {
            parent: "instance-a",
            type: "brick",
            brick: "basic-bricks.easy-view",
            mountPoint: "toolbar",
            properties: '{"containerStyle":{"gap":"var(--page-card-gap)"}}',
          },
          children: [
            {
              nodeUid: 8,
              parentUid: 7,
              nodeData: {
                type: "brick",
                brick: "basic-bricks.general-button",
                mountPoint: "header",
                events: '{"click":{"action":"console.log"}}',
                sort: 0,
              },
              children: [],
            },
          ],
        },
      ],
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
        Object {
          "child": 8,
          "mountPoint": "header",
          "parent": 7,
          "sort": 0,
        },
      ]
    `);
    expect(newData.nodes.slice(-2)).toMatchInlineSnapshot(`
      Array [
        Object {
          "$$matchedSelectors": Array [
            "basic-bricks\\\\.easy-view",
          ],
          "$$parsedEvents": Object {},
          "$$parsedLifeCycle": Object {},
          "$$parsedProperties": Object {
            "containerStyle": Object {
              "gap": "var(--page-card-gap)",
            },
          },
          "$$parsedProxy": Object {},
          "$$uid": 7,
          "alias": "easy-view",
          "brick": "basic-bricks.easy-view",
          "properties": "{\\"containerStyle\\":{\\"gap\\":\\"var(--page-card-gap)\\"}}",
          "type": "brick",
        },
        Object {
          "$$matchedSelectors": Array [
            "basic-bricks\\\\.general-button",
          ],
          "$$parsedEvents": Object {
            "click": Object {
              "action": "console.log",
            },
          },
          "$$parsedLifeCycle": Object {},
          "$$parsedProperties": Object {},
          "$$parsedProxy": Object {},
          "$$uid": 8,
          "alias": "general-button",
          "brick": "basic-bricks.general-button",
          "events": "{\\"click\\":{\\"action\\":\\"console.log\\"}}",
          "sort": 0,
          "type": "brick",
        },
      ]
    `);
    expect(listenOnSnippetApply).toBeCalled();
    expect(listenOnDataChange).toBeCalled();
    unlistenOnSnippetApply();
    unlistenOnDataChange();
  });

  it("should update stored nodes from snippet", () => {
    const listenOnDataChange = jest.fn();
    const unlistenOnDataChange = manager.onDataChange(listenOnDataChange);
    manager.snippetApply({
      parentUid: 3,
      nodeUids: [4, 6, 7, 5],
      nodeIds: null,
      nodeDetails: [
        {
          nodeUid: 7,
          parentUid: 3,
          nodeData: {
            mountPoint: "toolbar",
          } as Partial<NodeInstance> as NodeInstance,
          children: [
            {
              nodeUid: 8,
              parentUid: 7,
              nodeData: {
                mountPoint: "header",
              } as Partial<NodeInstance> as NodeInstance,
              children: [],
            },
          ],
        },
      ],
    });
    manager.snippetApplyStored({
      flattenNodeDetails: [
        {
          nodeUid: 7,
          nodeData: {
            id: "B-007",
          } as Partial<BuilderRouteOrBrickNode> as BuilderRouteOrBrickNode,
        },
        {
          nodeUid: 8,
          nodeData: {
            id: "B-008",
          } as Partial<BuilderRouteOrBrickNode> as BuilderRouteOrBrickNode,
        },
      ],
    });
    expect(manager.getData().nodes.find((node) => node.$$uid === 7).id).toBe(
      "B-007"
    );
    expect(manager.getData().nodes.find((node) => node.$$uid === 8).id).toBe(
      "B-008"
    );
    expect(listenOnDataChange).toBeCalled();
    unlistenOnDataChange();
  });

  it("should update context", () => {
    const listenOnDataChange = jest.fn();
    const unlistenOnDataChange = manager.onDataChange(listenOnDataChange);
    manager.contextUpdated({
      context: [
        {
          name: "data-1",
          value: "<% QUERY.id %>",
        },
        {
          name: "data-2",
          resolve: {
            useProvider: "provider-a",
            args: ["arg1"],
            transform: {
              value: "<% DATA %>",
            },
          },
        },
      ],
    });
    const newData = manager.getData();
    expect(newData.nodes[0]).toMatchInlineSnapshot(`
      Object {
        "$$matchedSelectors": Array [],
        "$$parsedEvents": Object {},
        "$$parsedLifeCycle": Object {},
        "$$parsedProperties": Object {},
        "$$parsedProxy": Object {},
        "$$uid": 1,
        "alias": undefined,
        "context": Array [
          Object {
            "name": "data-1",
            "value": "<% QUERY.id %>",
          },
          Object {
            "name": "data-2",
            "resolve": Object {
              "args": Array [
                "arg1",
              ],
              "transform": Object {
                "value": "<% DATA %>",
              },
              "useProvider": "provider-a",
            },
          },
        ],
        "id": "B-001",
        "path": "/home",
        "type": "bricks",
      }
    `);
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

  it("should delete a node", () => {
    const listenOnDataChange = jest.fn();
    const unlisten = manager.onDataChange(listenOnDataChange);
    manager.nodeDelete({
      $$uid: 3,
      id: "B-003",
      type: "brick",
      brick: "brick-b",
      sort: 1,
    });
    expect(manager.getData()).toMatchInlineSnapshot(`
      Object {
        "edges": Array [
          Object {
            "child": 2,
            "mountPoint": "bricks",
            "parent": 1,
            "sort": 0,
          },
        ],
        "nodes": Array [
          Object {
            "$$matchedSelectors": Array [],
            "$$parsedEvents": Object {},
            "$$parsedLifeCycle": Object {},
            "$$parsedProperties": Object {},
            "$$parsedProxy": Object {},
            "$$uid": 1,
            "alias": undefined,
            "id": "B-001",
            "path": "/home",
            "type": "bricks",
          },
          Object {
            "$$matchedSelectors": Array [
              "brick-a",
            ],
            "$$parsedEvents": Object {},
            "$$parsedLifeCycle": Object {},
            "$$parsedProperties": Object {},
            "$$parsedProxy": Object {},
            "$$uid": 2,
            "alias": "alias-a",
            "brick": "brick-a",
            "id": "B-002",
            "sort": 0,
            "type": "brick",
          },
        ],
        "rootId": 1,
      }
    `);
    expect(listenOnDataChange).toBeCalled();
    unlisten();
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

// Given a tree:
//            1 <routes>
//           ↙ ↘
// <bricks> 2   3 <routes>
//         ↙     ↘
//        4       5
describe("BuilderDataManager for route of routes", () => {
  let manager: BuilderDataManagerType;
  let BuilderDataManager: typeof BuilderDataManagerType;

  beforeEach(() => {
    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    BuilderDataManager = require("./BuilderDataManager").BuilderDataManager;
    manager = new BuilderDataManager();
    manager.dataInit({
      id: "B-001",
      type: "routes",
      path: "/home",
      children: [
        {
          id: "B-002",
          type: "bricks",
          path: "/home/a",
          sort: 0,
          mountPoint: "routes",
          alias: "alias-a",
          children: [
            {
              id: "B-003",
              type: "brick",
              brick: "brick-b",
              sort: 0,
              mountPoint: "content",
            },
          ],
        },
        {
          id: "B-004",
          type: "routes",
          path: "/home/c",
          sort: 1,
          mountPoint: "undefined",
          children: [
            {
              id: "B-005",
              type: "bricks",
              path: "/home/c/d",
              mountPoint: "content",
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
            "child": 3,
            "mountPoint": "bricks",
            "parent": 2,
            "sort": 0,
          },
          Object {
            "child": 2,
            "mountPoint": "routes",
            "parent": 1,
            "sort": 0,
          },
          Object {
            "child": 5,
            "mountPoint": "routes",
            "parent": 4,
            "sort": 0,
          },
          Object {
            "child": 4,
            "mountPoint": "routes",
            "parent": 1,
            "sort": 1,
          },
        ],
        "nodes": Array [
          Object {
            "$$matchedSelectors": Array [],
            "$$parsedEvents": Object {},
            "$$parsedLifeCycle": Object {},
            "$$parsedProperties": Object {},
            "$$parsedProxy": Object {},
            "$$uid": 1,
            "alias": undefined,
            "id": "B-001",
            "path": "/home",
            "type": "routes",
          },
          Object {
            "$$matchedSelectors": Array [],
            "$$parsedEvents": Object {},
            "$$parsedLifeCycle": Object {},
            "$$parsedProperties": Object {},
            "$$parsedProxy": Object {},
            "$$uid": 2,
            "alias": "alias-a",
            "id": "B-002",
            "path": "/home/a",
            "sort": 0,
            "type": "bricks",
          },
          Object {
            "$$matchedSelectors": Array [
              "brick-b",
            ],
            "$$parsedEvents": Object {},
            "$$parsedLifeCycle": Object {},
            "$$parsedProperties": Object {},
            "$$parsedProxy": Object {},
            "$$uid": 3,
            "alias": "brick-b",
            "brick": "brick-b",
            "id": "B-003",
            "sort": 0,
            "type": "brick",
          },
          Object {
            "$$matchedSelectors": Array [],
            "$$parsedEvents": Object {},
            "$$parsedLifeCycle": Object {},
            "$$parsedProperties": Object {},
            "$$parsedProxy": Object {},
            "$$uid": 4,
            "alias": undefined,
            "id": "B-004",
            "path": "/home/c",
            "sort": 1,
            "type": "routes",
          },
          Object {
            "$$matchedSelectors": Array [],
            "$$parsedEvents": Object {},
            "$$parsedLifeCycle": Object {},
            "$$parsedProperties": Object {},
            "$$parsedProxy": Object {},
            "$$uid": 5,
            "alias": undefined,
            "id": "B-005",
            "path": "/home/c/d",
            "type": "bricks",
          },
        ],
        "rootId": 1,
      }
    `);

    expect(manager.getRelatedNodesBasedOnEventsMap().size).toBe(5);
  });
});

describe("route list", () => {
  let manager: BuilderDataManagerType;
  let BuilderDataManager: typeof BuilderDataManagerType;

  beforeEach(() => {
    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    BuilderDataManager = require("./BuilderDataManager").BuilderDataManager;
    manager = new BuilderDataManager();
    const listenOnRouteListChange = jest.fn();
    const unlistenOnRouteListChange = manager.onRouteListChange(
      listenOnRouteListChange
    );
    manager.routeListInit([
      {
        type: "routes",
        path: "/homepage",
        id: "R-01",
      },
      {
        type: "bricks",
        path: "/homepage/b",
        id: "R-02",
      },
    ]);
    expect(listenOnRouteListChange).toBeCalled();
    unlistenOnRouteListChange();
  });

  it("should init route list data", () => {
    expect(manager.getRouteList()).toMatchInlineSnapshot(`
      Array [
        Object {
          "id": "R-01",
          "path": "/homepage",
          "type": "routes",
        },
        Object {
          "id": "R-02",
          "path": "/homepage/b",
          "type": "bricks",
        },
      ]
    `);
  });
});

describe("test hoverNodeUid", () => {
  let manager: BuilderDataManagerType;
  let BuilderDataManager: typeof BuilderDataManagerType;

  beforeEach(() => {
    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    BuilderDataManager = require("./BuilderDataManager").BuilderDataManager;
    manager = new BuilderDataManager();
    const listenOnHoverNodeChange = jest.fn();
    const unlistenOnHoverNodeChange = manager.onHoverNodeChange(
      listenOnHoverNodeChange
    );
    manager.setHoverNodeUid(1);
    expect(listenOnHoverNodeChange).toBeCalled();
    unlistenOnHoverNodeChange();
  });

  it("should get hover node uid", () => {
    expect(manager.getHoverNodeUid()).toBe(1);
  });
});

describe("test showRelatedNodesBasedOnEvents", () => {
  let manager: BuilderDataManagerType;
  let BuilderDataManager: typeof BuilderDataManagerType;

  beforeEach(() => {
    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    BuilderDataManager = require("./BuilderDataManager").BuilderDataManager;
    manager = new BuilderDataManager();
    const listenOnShowRelatedNodesBasedOnEventsChange = jest.fn();
    const unlistenOnShowRelatedNodesBasedOnEventsChange =
      manager.onShowRelatedNodesBasedOnEventsChange(
        listenOnShowRelatedNodesBasedOnEventsChange
      );
    manager.setShowRelatedNodesBasedOnEvents(true);
    expect(listenOnShowRelatedNodesBasedOnEventsChange).toBeCalled();
    unlistenOnShowRelatedNodesBasedOnEventsChange();
  });

  it("should get showRelatedNodesBasedOnEvents", () => {
    expect(manager.getShowRelatedNodesBasedOnEvents()).toBe(true);
  });
});

describe("test highlightNodes", () => {
  let manager: BuilderDataManagerType;
  let BuilderDataManager: typeof BuilderDataManagerType;

  beforeEach(() => {
    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    BuilderDataManager = require("./BuilderDataManager").BuilderDataManager;
    manager = new BuilderDataManager();
    const listenOnHighlightNodesChange = jest.fn();
    const unlistenOnHighlightNodesChange = manager.onHighlightNodesChange(
      listenOnHighlightNodesChange
    );
    manager.setHighlightNodes(new Set([1]));
    expect(listenOnHighlightNodesChange).toBeCalled();
    unlistenOnHighlightNodesChange();
  });

  it("should get highlightNodes", () => {
    expect(manager.getHighlightNodes()).toEqual(new Set([1]));
  });
});

describe("test storyList", () => {
  let manager: BuilderDataManagerType;
  let BuilderDataManager: typeof BuilderDataManagerType;

  beforeEach(() => {
    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    BuilderDataManager = require("./BuilderDataManager").BuilderDataManager;
    manager = new BuilderDataManager();
    manager.storyListInit([
      {
        category: "form-input",
        icon: {
          icon: "pencil-alt",
          lib: "fa",
        },
        storyId: "forms.general-input",
        text: {
          en: "general input",
          zh: "普通输入框",
        },
        description: {
          en: "general input",
          zh: "普通输入框",
        },
        doc: {
          name: "forms.general-input",
          editor: "forms.general-input--editor",
          author: "easyops",
        } as Partial<StoryDoc> as StoryDoc,
      },
      {
        category: "card",
        icon: {
          icon: "chevron-down",
          lib: "fa",
        },
        storyId: "basic-bricks.general-card",
        text: {
          en: "general-card",
          zh: "卡片",
        },
        doc: {
          name: "basic-bricks.general-card",
          editor: "base-card--editor",
          author: "easyops",
        },
      },
    ] as Partial<Story>[] as Story[]);
  });

  it("should init data", () => {
    expect(manager.getStoryList()).toEqual([
      {
        category: "form-input",
        icon: {
          icon: "pencil-alt",
          lib: "fa",
        },
        storyId: "forms.general-input",
        text: {
          en: "general input",
          zh: "普通输入框",
        },
        description: {
          en: "general input",
          zh: "普通输入框",
        },
        doc: {
          name: "forms.general-input",
          editor: "forms.general-input--editor",
          author: "easyops",
        },
      },
      {
        category: "card",
        icon: {
          icon: "chevron-down",
          lib: "fa",
        },
        storyId: "basic-bricks.general-card",
        text: {
          en: "general-card",
          zh: "卡片",
        },
        doc: {
          name: "basic-bricks.general-card",
          editor: "base-card--editor",
          author: "easyops",
        },
      },
    ]);
  });
});

describe("test toggleOutline", () => {
  let manager: BuilderDataManagerType;
  let BuilderDataManager: typeof BuilderDataManagerType;

  beforeEach(() => {
    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    BuilderDataManager = require("./BuilderDataManager").BuilderDataManager;
    manager = new BuilderDataManager();
  });

  it("should check if the outline of a specific node is enabled", () => {
    const listenOnOutlineEnabledNodesChange = jest.fn();
    const unlistenOnOutlineEnabledNodesChange =
      manager.onOutlineEnabledNodesChange(listenOnOutlineEnabledNodesChange);
    expect(manager.isOutlineEnabled("instance-a")).toBe(true);
    manager.toggleOutline("instance-a");
    expect(manager.isOutlineEnabled("instance-a")).toBe(false);
    manager.toggleOutline("instance-a");
    expect(manager.isOutlineEnabled("instance-a")).toBe(true);
    expect(listenOnOutlineEnabledNodesChange).toBeCalledTimes(2);
    unlistenOnOutlineEnabledNodesChange();
  });
});
