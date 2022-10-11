import {
  BuilderRouteOrBrickNode,
  Story,
  StoryDoc,
} from "@next-core/brick-types";
import { sortBy } from "lodash";
import {
  NodeInstance,
  EventDetailOfNodeAdd,
  EventDetailOfNodeMove,
  EventDetailOfSnippetApply,
  BuilderRuntimeNode,
  WorkbenchTreeNodeMoveProps,
  WorkbenchNodeAdd,
} from "../interfaces";
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
            "$$isTemplateDelegated": undefined,
            "$$isTemplateInternal": undefined,
            "child": 2,
            "mountPoint": "bricks",
            "parent": 1,
            "sort": 0,
          },
          Object {
            "$$isTemplateDelegated": undefined,
            "$$isTemplateInternal": undefined,
            "child": 4,
            "mountPoint": "content",
            "parent": 3,
            "sort": 0,
          },
          Object {
            "$$isTemplateDelegated": undefined,
            "$$isTemplateInternal": undefined,
            "child": 5,
            "mountPoint": "toolbar",
            "parent": 3,
            "sort": 1,
          },
          Object {
            "$$isTemplateDelegated": undefined,
            "$$isTemplateInternal": undefined,
            "child": 6,
            "mountPoint": "content",
            "parent": 3,
            "sort": 2,
          },
          Object {
            "$$isTemplateDelegated": undefined,
            "$$isTemplateInternal": undefined,
            "child": 3,
            "mountPoint": "bricks",
            "parent": 1,
            "sort": 1,
          },
        ],
        "nodes": Array [
          Object {
            "$$isTemplateInternalNode": undefined,
            "$$matchedSelectors": Array [],
            "$$normalized": Object {
              "path": "/home",
              "type": "bricks",
            },
            "$$parsedEvents": Object {},
            "$$parsedLifeCycle": Object {},
            "$$parsedProperties": Object {},
            "$$uid": 1,
            "alias": undefined,
            "id": "B-001",
            "path": "/home",
            "type": "bricks",
          },
          Object {
            "$$isTemplateInternalNode": undefined,
            "$$matchedSelectors": Array [
              "brick-a",
            ],
            "$$normalized": Object {
              "brick": "brick-a",
            },
            "$$parsedEvents": Object {},
            "$$parsedLifeCycle": Object {},
            "$$parsedProperties": Object {},
            "$$uid": 2,
            "alias": "alias-a",
            "brick": "brick-a",
            "id": "B-002",
            "sort": 0,
            "type": "brick",
          },
          Object {
            "$$isTemplateInternalNode": undefined,
            "$$matchedSelectors": Array [
              "brick-b",
            ],
            "$$normalized": Object {
              "brick": "brick-b",
            },
            "$$parsedEvents": Object {},
            "$$parsedLifeCycle": Object {},
            "$$parsedProperties": Object {},
            "$$uid": 3,
            "alias": "brick-b",
            "brick": "brick-b",
            "id": "B-003",
            "sort": 1,
            "type": "brick",
          },
          Object {
            "$$isTemplateInternalNode": undefined,
            "$$matchedSelectors": Array [
              "brick-c",
            ],
            "$$normalized": Object {
              "brick": "brick-c",
            },
            "$$parsedEvents": Object {},
            "$$parsedLifeCycle": Object {},
            "$$parsedProperties": Object {},
            "$$uid": 4,
            "alias": "brick-c",
            "brick": "brick-c",
            "id": "B-004",
            "type": "brick",
          },
          Object {
            "$$isTemplateInternalNode": undefined,
            "$$matchedSelectors": Array [
              "brick-d",
            ],
            "$$normalized": Object {
              "brick": "brick-d",
            },
            "$$parsedEvents": Object {},
            "$$parsedLifeCycle": Object {},
            "$$parsedProperties": Object {},
            "$$uid": 5,
            "alias": "brick-d",
            "brick": "brick-d",
            "id": "B-005",
            "type": "brick",
          },
          Object {
            "$$isTemplateInternalNode": undefined,
            "$$matchedSelectors": Array [
              "brick-e",
            ],
            "$$normalized": Object {
              "brick": "brick-e",
            },
            "$$parsedEvents": Object {},
            "$$parsedLifeCycle": Object {},
            "$$parsedProperties": Object {},
            "$$uid": 6,
            "alias": "brick-e",
            "brick": "brick-e",
            "id": "B-006",
            "sort": 1,
            "type": "brick",
          },
        ],
        "rootId": 1,
        "wrapperNode": undefined,
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
          "$$isTemplateDelegated": undefined,
          "$$isTemplateInternal": undefined,
          "child": 2,
          "mountPoint": "bricks",
          "parent": 1,
          "sort": 0,
        },
        Object {
          "$$isTemplateDelegated": undefined,
          "$$isTemplateInternal": undefined,
          "child": 4,
          "mountPoint": "content",
          "parent": 3,
          "sort": 0,
        },
        Object {
          "$$isTemplateDelegated": undefined,
          "$$isTemplateInternal": undefined,
          "child": 5,
          "mountPoint": "toolbar",
          "parent": 3,
          "sort": 3,
        },
        Object {
          "$$isTemplateDelegated": undefined,
          "$$isTemplateInternal": undefined,
          "child": 6,
          "mountPoint": "content",
          "parent": 3,
          "sort": 1,
        },
        Object {
          "$$isTemplateDelegated": undefined,
          "$$isTemplateInternal": undefined,
          "child": 3,
          "mountPoint": "bricks",
          "parent": 1,
          "sort": 1,
        },
        Object {
          "$$isTemplateDelegated": undefined,
          "child": 7,
          "mountPoint": "toolbar",
          "parent": 3,
          "sort": 2,
        },
      ]
    `);
    expect(newData.nodes[newData.nodes.length - 1]).toMatchInlineSnapshot(`
      Object {
        "$$isTemplateInternalNode": undefined,
        "$$matchedSelectors": Array [
          "my\\\\.any-brick",
        ],
        "$$normalized": Object {
          "brick": "my.any-brick",
        },
        "$$parsedEvents": Object {},
        "$$parsedLifeCycle": Object {},
        "$$parsedProperties": Object {},
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
        instanceId: "new-instance-id",
        other: "any",
      } as Partial<BuilderRouteOrBrickNode> as BuilderRouteOrBrickNode,
    });
    expect(
      manager.getData().nodes.find((node) => node.$$uid === 7)
    ).toMatchObject({
      id: "B-007",
      instanceId: "new-instance-id",
    });
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
          "$$isTemplateDelegated": undefined,
          "$$isTemplateInternal": undefined,
          "child": 2,
          "mountPoint": "bricks",
          "parent": 1,
          "sort": 0,
        },
        Object {
          "$$isTemplateDelegated": undefined,
          "$$isTemplateInternal": undefined,
          "child": 4,
          "mountPoint": "content",
          "parent": 3,
          "sort": 0,
        },
        Object {
          "$$isTemplateDelegated": undefined,
          "$$isTemplateInternal": undefined,
          "child": 5,
          "mountPoint": "toolbar",
          "parent": 3,
          "sort": 3,
        },
        Object {
          "$$isTemplateDelegated": undefined,
          "$$isTemplateInternal": undefined,
          "child": 6,
          "mountPoint": "content",
          "parent": 3,
          "sort": 1,
        },
        Object {
          "$$isTemplateDelegated": undefined,
          "$$isTemplateInternal": undefined,
          "child": 3,
          "mountPoint": "bricks",
          "parent": 1,
          "sort": 1,
        },
        Object {
          "$$isTemplateDelegated": undefined,
          "child": 7,
          "mountPoint": "toolbar",
          "parent": 3,
          "sort": 2,
        },
        Object {
          "$$isTemplateDelegated": undefined,
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
          "$$isTemplateInternalNode": undefined,
          "$$matchedSelectors": Array [
            "basic-bricks\\\\.easy-view",
          ],
          "$$normalized": Object {
            "brick": "basic-bricks.easy-view",
            "properties": Object {
              "containerStyle": Object {
                "gap": "var(--page-card-gap)",
              },
            },
          },
          "$$parsedEvents": Object {},
          "$$parsedLifeCycle": Object {},
          "$$parsedProperties": Object {
            "containerStyle": Object {
              "gap": "var(--page-card-gap)",
            },
          },
          "$$uid": 7,
          "alias": "easy-view",
          "brick": "basic-bricks.easy-view",
          "properties": "{\\"containerStyle\\":{\\"gap\\":\\"var(--page-card-gap)\\"}}",
          "type": "brick",
        },
        Object {
          "$$isTemplateInternalNode": undefined,
          "$$matchedSelectors": Array [
            "basic-bricks\\\\.general-button",
          ],
          "$$normalized": Object {
            "brick": "basic-bricks.general-button",
            "events": Object {
              "click": Object {
                "action": "console.log",
              },
            },
          },
          "$$parsedEvents": Object {
            "click": Object {
              "action": "console.log",
            },
          },
          "$$parsedLifeCycle": Object {},
          "$$parsedProperties": Object {},
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
            instanceId: "new-instance-id-a",
            other: "any",
          } as Partial<BuilderRouteOrBrickNode> as BuilderRouteOrBrickNode,
        },
        {
          nodeUid: 8,
          nodeData: {
            id: "B-008",
            instanceId: "new-instance-id-b",
            other: "any",
          } as Partial<BuilderRouteOrBrickNode> as BuilderRouteOrBrickNode,
        },
      ],
    });
    expect(
      manager.getData().nodes.find((node) => node.$$uid === 7)
    ).toMatchObject({
      id: "B-007",
      instanceId: "new-instance-id-a",
    });
    expect(
      manager.getData().nodes.find((node) => node.$$uid === 8)
    ).toMatchObject({
      id: "B-008",
      instanceId: "new-instance-id-b",
    });
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
        "$$isTemplateInternalNode": undefined,
        "$$matchedSelectors": Array [],
        "$$normalized": Object {
          "path": "/home",
          "type": "bricks",
        },
        "$$parsedEvents": Object {},
        "$$parsedLifeCycle": Object {},
        "$$parsedProperties": Object {},
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
          "$$isTemplateDelegated": undefined,
          "$$isTemplateInternal": undefined,
          "child": 2,
          "mountPoint": "bricks",
          "parent": 1,
          "sort": 0,
        },
        Object {
          "$$isTemplateDelegated": undefined,
          "$$isTemplateInternal": undefined,
          "child": 4,
          "mountPoint": "content",
          "parent": 3,
          "sort": 1,
        },
        Object {
          "$$isTemplateDelegated": undefined,
          "$$isTemplateInternal": undefined,
          "child": 5,
          "mountPoint": "toolbar",
          "parent": 3,
          "sort": 2,
        },
        Object {
          "$$isTemplateDelegated": undefined,
          "$$isTemplateInternal": undefined,
          "child": 3,
          "mountPoint": "bricks",
          "parent": 1,
          "sort": 1,
        },
        Object {
          "$$isTemplateDelegated": undefined,
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
          "$$isTemplateDelegated": undefined,
          "$$isTemplateInternal": undefined,
          "child": 2,
          "mountPoint": "bricks",
          "parent": 1,
          "sort": 0,
        },
        Object {
          "$$isTemplateDelegated": undefined,
          "$$isTemplateInternal": undefined,
          "child": 4,
          "mountPoint": "content",
          "parent": 3,
          "sort": 0,
        },
        Object {
          "$$isTemplateDelegated": undefined,
          "$$isTemplateInternal": undefined,
          "child": 6,
          "mountPoint": "content",
          "parent": 3,
          "sort": 2,
        },
        Object {
          "$$isTemplateDelegated": undefined,
          "$$isTemplateInternal": undefined,
          "child": 3,
          "mountPoint": "bricks",
          "parent": 1,
          "sort": 1,
        },
        Object {
          "$$isTemplateDelegated": undefined,
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
          "$$isTemplateDelegated": undefined,
          "$$isTemplateInternal": undefined,
          "child": 2,
          "mountPoint": "bricks",
          "parent": 1,
          "sort": 1,
        },
        Object {
          "$$isTemplateDelegated": undefined,
          "$$isTemplateInternal": undefined,
          "child": 4,
          "mountPoint": "content",
          "parent": 3,
          "sort": 0,
        },
        Object {
          "$$isTemplateDelegated": undefined,
          "$$isTemplateInternal": undefined,
          "child": 5,
          "mountPoint": "toolbar",
          "parent": 3,
          "sort": 1,
        },
        Object {
          "$$isTemplateDelegated": undefined,
          "$$isTemplateInternal": undefined,
          "child": 6,
          "mountPoint": "content",
          "parent": 3,
          "sort": 2,
        },
        Object {
          "$$isTemplateDelegated": undefined,
          "$$isTemplateInternal": undefined,
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
            "$$isTemplateDelegated": undefined,
            "$$isTemplateInternal": undefined,
            "child": 2,
            "mountPoint": "bricks",
            "parent": 1,
            "sort": 0,
          },
        ],
        "nodes": Array [
          Object {
            "$$isTemplateInternalNode": undefined,
            "$$matchedSelectors": Array [],
            "$$normalized": Object {
              "path": "/home",
              "type": "bricks",
            },
            "$$parsedEvents": Object {},
            "$$parsedLifeCycle": Object {},
            "$$parsedProperties": Object {},
            "$$uid": 1,
            "alias": undefined,
            "id": "B-001",
            "path": "/home",
            "type": "bricks",
          },
          Object {
            "$$isTemplateInternalNode": undefined,
            "$$matchedSelectors": Array [
              "brick-a",
            ],
            "$$normalized": Object {
              "brick": "brick-a",
            },
            "$$parsedEvents": Object {},
            "$$parsedLifeCycle": Object {},
            "$$parsedProperties": Object {},
            "$$uid": 2,
            "alias": "alias-a",
            "brick": "brick-a",
            "id": "B-002",
            "sort": 0,
            "type": "brick",
          },
        ],
        "rootId": 1,
        "wrapperNode": undefined,
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
            "$$isTemplateDelegated": undefined,
            "$$isTemplateInternal": undefined,
            "child": 3,
            "mountPoint": "bricks",
            "parent": 2,
            "sort": 0,
          },
          Object {
            "$$isTemplateDelegated": undefined,
            "$$isTemplateInternal": undefined,
            "child": 2,
            "mountPoint": "routes",
            "parent": 1,
            "sort": 0,
          },
          Object {
            "$$isTemplateDelegated": undefined,
            "$$isTemplateInternal": undefined,
            "child": 5,
            "mountPoint": "routes",
            "parent": 4,
            "sort": 0,
          },
          Object {
            "$$isTemplateDelegated": undefined,
            "$$isTemplateInternal": undefined,
            "child": 4,
            "mountPoint": "routes",
            "parent": 1,
            "sort": 1,
          },
        ],
        "nodes": Array [
          Object {
            "$$isTemplateInternalNode": undefined,
            "$$matchedSelectors": Array [],
            "$$normalized": Object {
              "path": "/home",
              "type": "routes",
            },
            "$$parsedEvents": Object {},
            "$$parsedLifeCycle": Object {},
            "$$parsedProperties": Object {},
            "$$uid": 1,
            "alias": undefined,
            "id": "B-001",
            "path": "/home",
            "type": "routes",
          },
          Object {
            "$$isTemplateInternalNode": undefined,
            "$$matchedSelectors": Array [],
            "$$normalized": Object {
              "alias": "alias-a",
              "path": "/home/a",
              "type": "bricks",
            },
            "$$parsedEvents": Object {},
            "$$parsedLifeCycle": Object {},
            "$$parsedProperties": Object {},
            "$$uid": 2,
            "alias": "alias-a",
            "id": "B-002",
            "path": "/home/a",
            "sort": 0,
            "type": "bricks",
          },
          Object {
            "$$isTemplateInternalNode": undefined,
            "$$matchedSelectors": Array [
              "brick-b",
            ],
            "$$normalized": Object {
              "brick": "brick-b",
            },
            "$$parsedEvents": Object {},
            "$$parsedLifeCycle": Object {},
            "$$parsedProperties": Object {},
            "$$uid": 3,
            "alias": "brick-b",
            "brick": "brick-b",
            "id": "B-003",
            "sort": 0,
            "type": "brick",
          },
          Object {
            "$$isTemplateInternalNode": undefined,
            "$$matchedSelectors": Array [],
            "$$normalized": Object {
              "path": "/home/c",
              "type": "routes",
            },
            "$$parsedEvents": Object {},
            "$$parsedLifeCycle": Object {},
            "$$parsedProperties": Object {},
            "$$uid": 4,
            "alias": undefined,
            "id": "B-004",
            "path": "/home/c",
            "sort": 1,
            "type": "routes",
          },
          Object {
            "$$isTemplateInternalNode": undefined,
            "$$matchedSelectors": Array [],
            "$$normalized": Object {
              "path": "/home/c/d",
              "type": "bricks",
            },
            "$$parsedEvents": Object {},
            "$$parsedLifeCycle": Object {},
            "$$parsedProperties": Object {},
            "$$uid": 5,
            "alias": undefined,
            "id": "B-005",
            "path": "/home/c/d",
            "type": "bricks",
          },
        ],
        "rootId": 1,
        "wrapperNode": undefined,
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
  });

  it("should return an empty array if data is not set", () => {
    expect(manager.getRouteList()).toEqual([]);
  });

  it("should init route list data", () => {
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
    ]);
    expect(listenOnRouteListChange).toBeCalled();
    unlistenOnRouteListChange();
    expect(manager.getRouteList()).toEqual([
      {
        type: "routes",
        path: "/homepage",
        id: "R-01",
      },
    ]);
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

describe("test sharedEditorList", () => {
  let manager: BuilderDataManagerType;
  let BuilderDataManager: typeof BuilderDataManagerType;

  beforeEach(() => {
    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    BuilderDataManager = require("./BuilderDataManager").BuilderDataManager;
    manager = new BuilderDataManager();
  });

  it("should return an empty array if data is not set", () => {
    expect(manager.getSharedEditorList()).toEqual([]);
  });

  it("should init shared editor list", () => {
    const listenOnSharedEditorListChange = jest.fn();
    const unlistenOnRouteListChange = manager.onSharedEditorListChange(
      listenOnSharedEditorListChange
    );
    manager.sharedEditorListInit([
      {
        id: "test.brick-a",
        editor: "shared.test-brick--editor",
      },
    ]);
    expect(listenOnSharedEditorListChange).toBeCalled();
    unlistenOnRouteListChange();
    expect(manager.getSharedEditorList()).toEqual([
      {
        id: "test.brick-a",
        editor: "shared.test-brick--editor",
      },
    ]);
  });
});

describe("test dropping status", () => {
  let manager: BuilderDataManagerType;
  let BuilderDataManager: typeof BuilderDataManagerType;

  beforeEach(() => {
    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    BuilderDataManager = require("./BuilderDataManager").BuilderDataManager;
    manager = new BuilderDataManager();
  });

  it("should return an empty map as initial", () => {
    expect(manager.getDroppingStatus()).toEqual(new Map());
  });

  it("should update dropping status", () => {
    const listenOnDroppingStatusChange = jest.fn();
    const unlistenOnDroppingStatusChange = manager.onDroppingStatusChange(
      listenOnDroppingStatusChange
    );
    const setHoverNodeUid = jest.spyOn(manager, "setHoverNodeUid");

    manager.updateDroppingStatus(1, "header", true);
    expect(manager.getDroppingStatus()).toEqual(
      new Map([[1, new Map([["header", true]])]])
    );

    expect(setHoverNodeUid).not.toBeCalled();
    manager.setHoverNodeUid(100);
    setHoverNodeUid.mockClear();

    manager.updateDroppingStatus(1, "header", false);
    expect(manager.getDroppingStatus()).toEqual(
      new Map([[1, new Map([["header", false]])]])
    );
    expect(setHoverNodeUid).not.toBeCalled();

    manager.updateDroppingStatus(1, "footer", true);
    expect(manager.getDroppingStatus()).toEqual(
      new Map([
        [
          1,
          new Map([
            ["header", false],
            ["footer", true],
          ]),
        ],
      ])
    );
    expect(setHoverNodeUid).toBeCalledWith(undefined);

    manager.updateDroppingStatus(2, "content", true);
    manager.updateDroppingStatus(1, "footer", false);
    expect(manager.getDroppingStatus()).toEqual(
      new Map([
        [
          1,
          new Map([
            ["header", false],
            ["footer", false],
          ]),
        ],
        [2, new Map([["content", true]])],
      ])
    );

    expect(listenOnDroppingStatusChange).toBeCalledTimes(5);
    expect(setHoverNodeUid).toBeCalledTimes(1);
    unlistenOnDroppingStatusChange();
  });
});

// Given a tree:
//         1
//       ↙   ↘
// (content) (toolbar)
//    ↙↓↘       ↙ ↘
//   2 3 4     5   6
describe("move node or mount point", () => {
  let manager: BuilderDataManagerType;
  let BuilderDataManager: typeof BuilderDataManagerType;
  const listenOnDataChange = jest.fn();
  const listenOnNodeReorder = jest.fn();
  const removeListeners: Array<() => void> = [];

  const getNodeById = (id: string): BuilderRuntimeNode =>
    manager.getData().nodes.find((node) => node.id === id);

  const getSortedChildIds = (): string[] => {
    const rootBrick = getNodeById("B-001");
    return sortBy(
      manager.getData().edges.filter((edge) => edge.parent === rootBrick.$$uid),
      "sort"
    ).map(
      (edge) =>
        manager.getData().nodes.find((node) => node.$$uid === edge.child).id
    );
  };

  beforeEach(() => {
    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    BuilderDataManager = require("./BuilderDataManager").BuilderDataManager;
    manager = new BuilderDataManager();
    manager.dataInit({
      id: "B-000",
      type: "bricks",
      path: "/home",
      children: [
        {
          id: "B-001",
          type: "brick",
          brick: "brick-a",
          sort: 1,
          mountPoint: "bricks",
          children: [
            {
              id: "B-002",
              type: "brick",
              brick: "brick-b",
              mountPoint: "content",
            },
            {
              id: "B-003",
              type: "brick",
              brick: "brick-c",
              mountPoint: "content",
            },
            {
              id: "B-004",
              type: "brick",
              brick: "brick-d",
              mountPoint: "content",
            },
            {
              id: "B-005",
              type: "brick",
              brick: "brick-e",
              mountPoint: "toolbar",
            },
            {
              id: "B-006",
              type: "brick",
              brick: "brick-f",
              mountPoint: "toolbar",
            },
          ],
        },
      ],
    });
    removeListeners.push(
      manager.onDataChange((e) =>
        listenOnDataChange((e as CustomEvent).detail)
      ),
      manager.onNodeReorder((e) => listenOnNodeReorder(e.detail))
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    while (removeListeners.length > 0) {
      removeListeners.pop()();
    }
  });

  it("should move node down from first", () => {
    expect(getSortedChildIds()).toEqual([
      "B-002",
      "B-003",
      "B-004",
      "B-005",
      "B-006",
    ]);
    manager.moveNode(getNodeById("B-002"), "down");
    expect(getSortedChildIds()).toEqual([
      "B-003",
      "B-002",
      "B-004",
      "B-005",
      "B-006",
    ]);
    expect(listenOnDataChange).toBeCalledTimes(1);
    expect(listenOnNodeReorder).toBeCalledTimes(1);
    expect(listenOnNodeReorder).toBeCalledWith({
      nodeIds: ["B-003", "B-002", "B-004", "B-005", "B-006"],
      nodeUids: [4, 3, 5, 6, 7],
      parentUid: 2,
      objectId: "STORYBOARD_BRICK",
    });
  });

  it("should move node down from middle", () => {
    expect(getSortedChildIds()).toEqual([
      "B-002",
      "B-003",
      "B-004",
      "B-005",
      "B-006",
    ]);
    manager.moveNode(getNodeById("B-003"), "down");
    expect(getSortedChildIds()).toEqual([
      "B-002",
      "B-004",
      "B-003",
      "B-005",
      "B-006",
    ]);
    expect(listenOnDataChange).toBeCalledTimes(1);
    expect(listenOnNodeReorder).toBeCalledTimes(1);
    expect(listenOnNodeReorder).toBeCalledWith({
      nodeIds: ["B-002", "B-004", "B-003", "B-005", "B-006"],
      nodeUids: [3, 5, 4, 6, 7],
      parentUid: 2,
      objectId: "STORYBOARD_BRICK",
    });
  });

  it("should ignore move node down from last", () => {
    expect(getSortedChildIds()).toEqual([
      "B-002",
      "B-003",
      "B-004",
      "B-005",
      "B-006",
    ]);
    manager.moveNode(getNodeById("B-004"), "down");
    expect(getSortedChildIds()).toEqual([
      "B-002",
      "B-003",
      "B-004",
      "B-005",
      "B-006",
    ]);
    expect(listenOnDataChange).toBeCalledTimes(0);
    expect(listenOnNodeReorder).toBeCalledTimes(0);
  });

  it("should move node up from last", () => {
    expect(getSortedChildIds()).toEqual([
      "B-002",
      "B-003",
      "B-004",
      "B-005",
      "B-006",
    ]);
    manager.moveNode(getNodeById("B-004"), "up");
    expect(getSortedChildIds()).toEqual([
      "B-002",
      "B-004",
      "B-003",
      "B-005",
      "B-006",
    ]);
    expect(listenOnDataChange).toBeCalledTimes(1);
    expect(listenOnNodeReorder).toBeCalledTimes(1);
    expect(listenOnNodeReorder).toBeCalledWith({
      nodeIds: ["B-002", "B-004", "B-003", "B-005", "B-006"],
      nodeUids: [3, 5, 4, 6, 7],
      parentUid: 2,
      objectId: "STORYBOARD_BRICK",
    });
  });

  it("should move node up from middle", () => {
    expect(getSortedChildIds()).toEqual([
      "B-002",
      "B-003",
      "B-004",
      "B-005",
      "B-006",
    ]);
    manager.moveNode(getNodeById("B-003"), "up");
    expect(getSortedChildIds()).toEqual([
      "B-003",
      "B-002",
      "B-004",
      "B-005",
      "B-006",
    ]);
    expect(listenOnDataChange).toBeCalledTimes(1);
    expect(listenOnNodeReorder).toBeCalledTimes(1);
    expect(listenOnNodeReorder).toBeCalledWith({
      nodeIds: ["B-003", "B-002", "B-004", "B-005", "B-006"],
      nodeUids: [4, 3, 5, 6, 7],
      parentUid: 2,
      objectId: "STORYBOARD_BRICK",
    });
  });

  it("should ignore move node up from first", () => {
    expect(getSortedChildIds()).toEqual([
      "B-002",
      "B-003",
      "B-004",
      "B-005",
      "B-006",
    ]);
    manager.moveNode(getNodeById("B-002"), "up");
    expect(getSortedChildIds()).toEqual([
      "B-002",
      "B-003",
      "B-004",
      "B-005",
      "B-006",
    ]);
    expect(listenOnDataChange).toBeCalledTimes(0);
    expect(listenOnNodeReorder).toBeCalledTimes(0);
  });

  it("should move mount point down from first", () => {
    expect(getSortedChildIds()).toEqual([
      "B-002",
      "B-003",
      "B-004",
      "B-005",
      "B-006",
    ]);
    manager.moveMountPoint(getNodeById("B-001"), "content", "down");
    expect(getSortedChildIds()).toEqual([
      "B-005",
      "B-006",
      "B-002",
      "B-003",
      "B-004",
    ]);
    expect(listenOnDataChange).toBeCalledTimes(1);
    expect(listenOnNodeReorder).toBeCalledTimes(1);
    expect(listenOnNodeReorder).toBeCalledWith({
      nodeIds: ["B-005", "B-006", "B-002", "B-003", "B-004"],
      nodeUids: [6, 7, 3, 4, 5],
      parentUid: 2,
      objectId: "STORYBOARD_BRICK",
    });
  });

  it("should ignore move mount point up from first", () => {
    expect(getSortedChildIds()).toEqual([
      "B-002",
      "B-003",
      "B-004",
      "B-005",
      "B-006",
    ]);
    manager.moveMountPoint(getNodeById("B-001"), "content", "up");
    expect(getSortedChildIds()).toEqual([
      "B-002",
      "B-003",
      "B-004",
      "B-005",
      "B-006",
    ]);
    expect(listenOnDataChange).toBeCalledTimes(0);
    expect(listenOnNodeReorder).toBeCalledTimes(0);
  });

  it("should move mount point up from last", () => {
    expect(getSortedChildIds()).toEqual([
      "B-002",
      "B-003",
      "B-004",
      "B-005",
      "B-006",
    ]);
    manager.moveMountPoint(getNodeById("B-001"), "toolbar", "up");
    expect(getSortedChildIds()).toEqual([
      "B-005",
      "B-006",
      "B-002",
      "B-003",
      "B-004",
    ]);
    expect(listenOnDataChange).toBeCalledTimes(1);
    expect(listenOnNodeReorder).toBeCalledTimes(1);
    expect(listenOnNodeReorder).toBeCalledWith({
      nodeIds: ["B-005", "B-006", "B-002", "B-003", "B-004"],
      nodeUids: [6, 7, 3, 4, 5],
      parentUid: 2,
      objectId: "STORYBOARD_BRICK",
    });
  });

  it("should ignore move mount point down from last", () => {
    expect(getSortedChildIds()).toEqual([
      "B-002",
      "B-003",
      "B-004",
      "B-005",
      "B-006",
    ]);
    manager.moveMountPoint(getNodeById("B-001"), "toolbar", "down");
    expect(getSortedChildIds()).toEqual([
      "B-002",
      "B-003",
      "B-004",
      "B-005",
      "B-006",
    ]);
    expect(listenOnDataChange).toBeCalledTimes(0);
    expect(listenOnNodeReorder).toBeCalledTimes(0);
  });
});

describe("BuilderDataManager for route of routes with wrapper", () => {
  let manager: BuilderDataManagerType;
  let BuilderDataManager: typeof BuilderDataManagerType;

  beforeEach(() => {
    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    BuilderDataManager = require("./BuilderDataManager").BuilderDataManager;
    manager = new BuilderDataManager();
    const templateSource = new Map();
    templateSource.set("tpl-page-base-page-module-1", {
      templateId: "tpl-page-base-page-module-1",
      id: "B-006",
      instanceId: "abc",
      layoutType: "wrapper",
      children: [
        {
          id: "B-007",
          brick: "basic-bricks.easy-view",
          type: "brick",
          mountPoint: "bricks",
          children: [
            {
              id: "B-008",
              brick: "basic-bricks.general-button",
              type: "brick",
              mountPoint: "top",
            },
          ],
        },
      ],
    });
    manager.dataInit(
      {
        id: "B-001",
        type: "bricks",
        instanceId: "route-a",
        path: "/home",
        children: [
          {
            id: "B-002",
            brick: "tpl-page-base-page-module-1",
            type: "brick",
            mountPoint: "bricks",
            instanceId: "abc",
            children: [
              {
                id: "B-003",
                type: "brick",
                brick: "basic-bricks.micro-view",
                sort: 0,
                mountPoint: "content",
                instanceId: "brick-b",
                children: [
                  {
                    id: "B-004",
                    type: "brick",
                    brick: "basic-bricks.general-button",
                    sort: 0,
                    mountPoint: "toolbar",
                  },
                ],
              },
              {
                id: "B-005",
                type: "brick",
                instanceId: "brick-c",
                brick: "basic-bricks.general-button",
                sort: 1,
                mountPoint: "content",
              },
            ],
          },
        ],
      },
      templateSource
    );
  });

  it("should init data", () => {
    expect(manager.getData()).toMatchInlineSnapshot(`
      Object {
        "edges": Array [
          Object {
            "$$isTemplateDelegated": undefined,
            "$$isTemplateInternal": true,
            "child": 4,
            "mountPoint": "top",
            "parent": 3,
            "sort": 0,
          },
          Object {
            "$$isTemplateInternal": true,
            "child": 3,
            "mountPoint": "",
            "parent": 2,
            "sort": 0,
          },
          Object {
            "$$isTemplateDelegated": undefined,
            "$$isTemplateInternal": undefined,
            "child": 6,
            "mountPoint": "toolbar",
            "parent": 5,
            "sort": 0,
          },
          Object {
            "$$isTemplateDelegated": true,
            "$$isTemplateInternal": undefined,
            "child": 5,
            "mountPoint": "content",
            "parent": 2,
            "sort": 0,
          },
          Object {
            "$$isTemplateDelegated": true,
            "$$isTemplateInternal": undefined,
            "child": 7,
            "mountPoint": "content",
            "parent": 2,
            "sort": 1,
          },
          Object {
            "$$isTemplateDelegated": undefined,
            "$$isTemplateInternal": undefined,
            "child": 2,
            "mountPoint": "bricks",
            "parent": 1,
            "sort": 0,
          },
        ],
        "nodes": Array [
          Object {
            "$$isTemplateInternalNode": undefined,
            "$$matchedSelectors": Array [],
            "$$normalized": Object {
              "path": "/home",
              "type": "bricks",
            },
            "$$parsedEvents": Object {},
            "$$parsedLifeCycle": Object {},
            "$$parsedProperties": Object {},
            "$$uid": 1,
            "alias": undefined,
            "id": "B-001",
            "instanceId": "route-a",
            "path": "/home",
            "type": "bricks",
          },
          Object {
            "$$isExpandableTemplate": true,
            "$$isTemplateInternalNode": undefined,
            "$$matchedSelectors": Array [
              "tpl-page-base-page-module-1",
            ],
            "$$normalized": Object {
              "brick": "tpl-page-base-page-module-1",
              "iid": "abc",
            },
            "$$parsedEvents": Object {},
            "$$parsedLifeCycle": Object {},
            "$$parsedProperties": Object {},
            "$$templateProxy": undefined,
            "$$templateRefToUid": Map {},
            "$$uid": 2,
            "alias": "tpl-page-base-page-module-1",
            "brick": "tpl-page-base-page-module-1",
            "id": "B-002",
            "instanceId": "abc",
            "layoutType": "wrapper",
            "type": "brick",
          },
          Object {
            "$$isTemplateInternalNode": true,
            "$$matchedSelectors": Array [
              "basic-bricks\\\\.easy-view",
            ],
            "$$normalized": Object {
              "brick": "basic-bricks.easy-view",
            },
            "$$parsedEvents": Object {},
            "$$parsedLifeCycle": Object {},
            "$$parsedProperties": Object {},
            "$$uid": 3,
            "alias": "easy-view",
            "brick": "basic-bricks.easy-view",
            "id": "B-007",
            "type": "brick",
          },
          Object {
            "$$isTemplateInternalNode": true,
            "$$matchedSelectors": Array [
              "basic-bricks\\\\.general-button",
            ],
            "$$normalized": Object {
              "brick": "basic-bricks.general-button",
            },
            "$$parsedEvents": Object {},
            "$$parsedLifeCycle": Object {},
            "$$parsedProperties": Object {},
            "$$uid": 4,
            "alias": "general-button",
            "brick": "basic-bricks.general-button",
            "id": "B-008",
            "type": "brick",
          },
          Object {
            "$$isTemplateInternalNode": undefined,
            "$$matchedSelectors": Array [
              "basic-bricks\\\\.micro-view",
            ],
            "$$normalized": Object {
              "brick": "basic-bricks.micro-view",
              "iid": "brick-b",
            },
            "$$parsedEvents": Object {},
            "$$parsedLifeCycle": Object {},
            "$$parsedProperties": Object {},
            "$$uid": 5,
            "alias": "micro-view",
            "brick": "basic-bricks.micro-view",
            "id": "B-003",
            "instanceId": "brick-b",
            "sort": 0,
            "type": "brick",
          },
          Object {
            "$$isTemplateInternalNode": undefined,
            "$$matchedSelectors": Array [
              "basic-bricks\\\\.general-button",
            ],
            "$$normalized": Object {
              "brick": "basic-bricks.general-button",
            },
            "$$parsedEvents": Object {},
            "$$parsedLifeCycle": Object {},
            "$$parsedProperties": Object {},
            "$$uid": 6,
            "alias": "general-button",
            "brick": "basic-bricks.general-button",
            "id": "B-004",
            "sort": 0,
            "type": "brick",
          },
          Object {
            "$$isTemplateInternalNode": undefined,
            "$$matchedSelectors": Array [
              "basic-bricks\\\\.general-button",
            ],
            "$$normalized": Object {
              "brick": "basic-bricks.general-button",
              "iid": "brick-c",
            },
            "$$parsedEvents": Object {},
            "$$parsedLifeCycle": Object {},
            "$$parsedProperties": Object {},
            "$$uid": 7,
            "alias": "general-button",
            "brick": "basic-bricks.general-button",
            "id": "B-005",
            "instanceId": "brick-c",
            "sort": 1,
            "type": "brick",
          },
        ],
        "rootId": 1,
        "wrapperNode": Object {
          "$$isExpandableTemplate": true,
          "$$isTemplateInternalNode": undefined,
          "$$matchedSelectors": Array [
            "tpl-page-base-page-module-1",
          ],
          "$$normalized": Object {
            "brick": "tpl-page-base-page-module-1",
            "iid": "abc",
          },
          "$$parsedEvents": Object {},
          "$$parsedLifeCycle": Object {},
          "$$parsedProperties": Object {},
          "$$templateProxy": undefined,
          "$$templateRefToUid": Map {},
          "$$uid": 2,
          "alias": "tpl-page-base-page-module-1",
          "brick": "tpl-page-base-page-module-1",
          "id": "B-002",
          "instanceId": "abc",
          "layoutType": "wrapper",
          "type": "brick",
        },
      }
    `);

    expect(manager.getRelatedNodesBasedOnEventsMap().size).toBe(7);
  });

  it("should redirect node", () => {
    const node1: EventDetailOfNodeAdd = {
      nodeUid: 4,
      parentUid: 2,
      nodeUids: [3],
      nodeData: {
        mountPoint: "bricks",
        parent: "abc",
      } as Partial<NodeInstance> as NodeInstance,
      nodeIds: null,
    };
    manager.nodeAdd(node1);
    expect(node1.nodeData.mountPoint).toBe("content");

    const node2: EventDetailOfNodeMove = {
      nodeUid: 3,
      parentUid: 1,
      nodeUids: [],
      nodeInstanceId: "123",
      nodeData: {
        mountPoint: "content",
        parent: "root",
      } as Partial<NodeInstance> as NodeInstance,
      nodeIds: null,
    };
    manager.nodeMove(node2);
    expect(node2.nodeData.mountPoint).toBe("bricks");
  });

  describe("workbenchTreeNodeMove should work", () => {
    it("move event should work", () => {
      const mockOnWorkbenchTreeNodeMove = jest.fn();
      manager.onWorkbenchTreeNodeMove(mockOnWorkbenchTreeNodeMove);
      const node: WorkbenchTreeNodeMoveProps = {
        dragNodeUid: 5,
        dragOverNodeUid: 3,
        dragParentNodeUid: 2,
        dragStatus: "top",
      };
      manager.workbenchTreeNodeMove(node);
      expect(mockOnWorkbenchTreeNodeMove).toBeCalled();
      expect(mockOnWorkbenchTreeNodeMove.mock.calls[0][0].detail).toEqual({
        nodeData: {
          mountPoint: "",
          parent: "abc",
        },
        nodeIds: ["B-003", "B-007", "B-005"],
        nodeInstanceId: "brick-b",
        nodeUid: 5,
        objectId: "STORYBOARD_BRICK",
      });

      const node2: WorkbenchTreeNodeMoveProps = {
        dragNodeUid: 5,
        dragOverNodeUid: 3,
        dragParentNodeUid: 2,
        dragStatus: "inside",
      };
      manager.workbenchTreeNodeMove(node2);
      expect(mockOnWorkbenchTreeNodeMove.mock.calls[1][0].detail).toEqual({
        nodeData: { mountPoint: "content", parent: undefined },
        nodeIds: ["B-008", "B-003"],
        nodeInstanceId: "brick-b",
        nodeUid: 5,
        objectId: "STORYBOARD_BRICK",
      });
    });

    it("move the node inside the other node", () => {
      const node: WorkbenchTreeNodeMoveProps = {
        dragNodeUid: 5,
        dragOverNodeUid: 6,
        dragParentNodeUid: 6,
        dragStatus: "inside",
      };
      manager.workbenchTreeNodeMove(node);
      expect(manager.getData().edges).toEqual([
        {
          $$isTemplateDelegated: undefined,
          $$isTemplateInternal: true,
          child: 4,
          mountPoint: "top",
          parent: 3,
          sort: 0,
        },
        {
          $$isTemplateInternal: true,
          child: 3,
          mountPoint: "",
          parent: 2,
          sort: 0,
        },
        {
          $$isTemplateDelegated: undefined,
          $$isTemplateInternal: undefined,
          child: 6,
          mountPoint: "toolbar",
          parent: 5,
          sort: 0,
        },
        {
          $$isTemplateDelegated: true,
          $$isTemplateInternal: undefined,
          child: 7,
          mountPoint: "content",
          parent: 2,
          sort: 1,
        },
        {
          $$isTemplateDelegated: undefined,
          $$isTemplateInternal: undefined,
          child: 2,
          mountPoint: "bricks",
          parent: 1,
          sort: 0,
        },
        {
          $$isTemplateDelegated: undefined,
          child: 5,
          mountPoint: "content",
          parent: 6,
          sort: 0,
        },
      ]);
    });

    it("move the node to the root, mountPoint should be bricks", () => {
      const node: WorkbenchTreeNodeMoveProps = {
        dragNodeUid: 5,
        dragOverNodeUid: 1,
        dragParentNodeUid: 1,
        dragStatus: "inside",
      };
      manager.workbenchTreeNodeMove(node);
      expect(manager.getData().edges).toEqual([
        {
          $$isTemplateDelegated: undefined,
          $$isTemplateInternal: true,
          child: 4,
          mountPoint: "top",
          parent: 3,
          sort: 0,
        },
        {
          $$isTemplateInternal: true,
          child: 3,
          mountPoint: "",
          parent: 2,
          sort: 0,
        },
        {
          $$isTemplateDelegated: undefined,
          $$isTemplateInternal: undefined,
          child: 6,
          mountPoint: "toolbar",
          parent: 5,
          sort: 0,
        },
        {
          $$isTemplateDelegated: true,
          $$isTemplateInternal: undefined,
          child: 7,
          mountPoint: "content",
          parent: 2,
          sort: 1,
        },
        {
          $$isTemplateDelegated: undefined,
          $$isTemplateInternal: undefined,
          child: 2,
          mountPoint: "bricks",
          parent: 1,
          sort: 0,
        },
        {
          $$isTemplateDelegated: undefined,
          child: 5,
          mountPoint: "bricks",
          parent: 1,
          sort: 1,
        },
      ]);
    });

    it("move the node to top", () => {
      const node: WorkbenchTreeNodeMoveProps = {
        dragNodeUid: 3,
        dragOverNodeUid: 2,
        dragParentNodeUid: 2,
        dragStatus: "top",
      };
      manager.workbenchTreeNodeMove(node);
      expect(manager.getData().edges).toEqual([
        {
          $$isTemplateDelegated: undefined,
          $$isTemplateInternal: true,
          child: 4,
          mountPoint: "top",
          parent: 3,
          sort: 0,
        },
        {
          $$isTemplateDelegated: undefined,
          $$isTemplateInternal: undefined,
          child: 6,
          mountPoint: "toolbar",
          parent: 5,
          sort: 0,
        },
        {
          $$isTemplateDelegated: true,
          $$isTemplateInternal: undefined,
          child: 5,
          mountPoint: "content",
          parent: 2,
          sort: 0,
        },
        {
          $$isTemplateDelegated: true,
          $$isTemplateInternal: undefined,
          child: 7,
          mountPoint: "content",
          parent: 2,
          sort: 1,
        },
        {
          $$isTemplateDelegated: undefined,
          $$isTemplateInternal: undefined,
          child: 2,
          mountPoint: "bricks",
          parent: 1,
          sort: 1,
        },
        {
          $$isTemplateDelegated: undefined,
          child: 3,
          mountPoint: "bricks",
          parent: 1,
          sort: 0,
        },
      ]);
    });

    it("move the node to bottom", () => {
      const node: WorkbenchTreeNodeMoveProps = {
        dragNodeUid: 3,
        dragOverNodeUid: 2,
        dragParentNodeUid: 2,
        dragStatus: "bottom",
      };
      manager.workbenchTreeNodeMove(node);
      expect(manager.getData().edges).toEqual([
        {
          $$isTemplateDelegated: undefined,
          $$isTemplateInternal: true,
          child: 4,
          mountPoint: "top",
          parent: 3,
          sort: 0,
        },
        {
          $$isTemplateDelegated: undefined,
          $$isTemplateInternal: undefined,
          child: 6,
          mountPoint: "toolbar",
          parent: 5,
          sort: 0,
        },
        {
          $$isTemplateDelegated: true,
          $$isTemplateInternal: undefined,
          child: 5,
          mountPoint: "content",
          parent: 2,
          sort: 0,
        },
        {
          $$isTemplateDelegated: true,
          $$isTemplateInternal: undefined,
          child: 7,
          mountPoint: "content",
          parent: 2,
          sort: 1,
        },
        {
          $$isTemplateDelegated: undefined,
          $$isTemplateInternal: undefined,
          child: 2,
          mountPoint: "bricks",
          parent: 1,
          sort: 0,
        },
        {
          $$isTemplateDelegated: undefined,
          child: 3,
          mountPoint: "bricks",
          parent: 1,
          sort: 1,
        },
      ]);
    });
  });

  describe("workbenchNodeAdd should work", () => {
    it("insert a node", () => {
      const node = {
        dragOverInstanceId: "abc",
        parent: "route-a",
        mountPoint: "content",
        nodeData: {
          brick: "butotn",
          instanceId: "mock_iid",
          id: "mock_id",
          type: "brick",
        },
        dragStatus: "inside",
      } as WorkbenchNodeAdd;
      manager.workbenchNodeAdd(node);
      expect(manager.getData().edges).toEqual([
        {
          $$isTemplateDelegated: undefined,
          $$isTemplateInternal: true,
          child: 4,
          mountPoint: "top",
          parent: 3,
          sort: 0,
        },
        {
          $$isTemplateInternal: true,
          child: 3,
          mountPoint: "",
          parent: 2,
          sort: 0,
        },
        {
          $$isTemplateDelegated: undefined,
          $$isTemplateInternal: undefined,
          child: 6,
          mountPoint: "toolbar",
          parent: 5,
          sort: 0,
        },
        {
          $$isTemplateDelegated: true,
          $$isTemplateInternal: undefined,
          child: 5,
          mountPoint: "content",
          parent: 2,
          sort: 0,
        },
        {
          $$isTemplateDelegated: true,
          $$isTemplateInternal: undefined,
          child: 7,
          mountPoint: "content",
          parent: 2,
          sort: 1,
        },
        {
          $$isTemplateDelegated: undefined,
          $$isTemplateInternal: undefined,
          child: 2,
          mountPoint: "bricks",
          parent: 1,
          sort: 0,
        },
        {
          $$isTemplateDelegated: undefined,
          child: 8,
          mountPoint: "content",
          parent: 1,
          sort: 1,
        },
      ]);

      expect(node.sortData).toEqual({
        nodeIds: ["B-002", "mock_id"],
        nodeInstanceIds: ["abc", "mock_iid"],
        nodeUids: [2],
      });
    });

    it("insert a node after micro-view", () => {
      const node = {
        dragOverInstanceId: "brick-b",
        parent: "abc",
        mountPoint: "content",
        nodeData: {
          brick: "div",
          instanceId: null,
          id: null,
          type: "brick",
        },
        dragStatus: "top",
      } as WorkbenchNodeAdd;
      manager.workbenchNodeAdd(node);
      expect(manager.getData().edges).toEqual([
        {
          $$isTemplateDelegated: undefined,
          $$isTemplateInternal: true,
          child: 4,
          mountPoint: "top",
          parent: 3,
          sort: 0,
        },
        {
          $$isTemplateInternal: true,
          child: 3,
          mountPoint: "",
          parent: 2,
          sort: 0,
        },
        {
          $$isTemplateDelegated: undefined,
          $$isTemplateInternal: undefined,
          child: 6,
          mountPoint: "toolbar",
          parent: 5,
          sort: 0,
        },
        {
          $$isTemplateDelegated: true,
          $$isTemplateInternal: undefined,
          child: 5,
          mountPoint: "content",
          parent: 2,
          sort: 2,
        },
        {
          $$isTemplateDelegated: true,
          $$isTemplateInternal: undefined,
          child: 7,
          mountPoint: "content",
          parent: 2,
          sort: 3,
        },
        {
          $$isTemplateDelegated: undefined,
          $$isTemplateInternal: undefined,
          child: 2,
          mountPoint: "bricks",
          parent: 1,
          sort: 0,
        },
        {
          $$isTemplateDelegated: true,
          child: 8,
          mountPoint: "content",
          parent: 2,
          sort: 1,
        },
      ]);
    });

    it("insert a node into root", () => {
      const node = {
        dragOverInstanceId: "route-a",
        parent: "route-a",
        mountPoint: "bricks",
        nodeData: {
          brick: "root-button",
          instanceId: null,
          id: null,
          type: "brick",
        },
        dragStatus: "inside",
      } as WorkbenchNodeAdd;
      manager.workbenchNodeAdd(node);
      expect(manager.getData().edges).toEqual([
        {
          $$isTemplateDelegated: undefined,
          $$isTemplateInternal: true,
          child: 4,
          mountPoint: "top",
          parent: 3,
          sort: 0,
        },
        {
          $$isTemplateInternal: true,
          child: 3,
          mountPoint: "",
          parent: 2,
          sort: 0,
        },
        {
          $$isTemplateDelegated: undefined,
          $$isTemplateInternal: undefined,
          child: 6,
          mountPoint: "toolbar",
          parent: 5,
          sort: 0,
        },
        {
          $$isTemplateDelegated: true,
          $$isTemplateInternal: undefined,
          child: 5,
          mountPoint: "content",
          parent: 2,
          sort: 0,
        },
        {
          $$isTemplateDelegated: true,
          $$isTemplateInternal: undefined,
          child: 7,
          mountPoint: "content",
          parent: 2,
          sort: 1,
        },
        {
          $$isTemplateDelegated: undefined,
          $$isTemplateInternal: undefined,
          child: 2,
          mountPoint: "bricks",
          parent: 1,
          sort: 0,
        },
        {
          $$isTemplateDelegated: undefined,
          child: 8,
          mountPoint: "bricks",
          parent: 1,
          sort: 1,
        },
      ]);
    });

    it("intert snippet should work", () => {
      const listenOnSnippetApply = jest.fn();
      manager.onSnippetApply(listenOnSnippetApply);
      const node = {
        dragOverInstanceId: "route-a",
        parent: "route-a",
        mountPoint: "bricks",
        dragStatus: "inside",
        nodeData: {
          brick: "",
          instanceId: null,
          id: null,
          type: "brick",
          bricks: [
            {
              brick: "div",
              properties: {},
              lifeCycle: {
                onPageLoad: [
                  {
                    useProvider: "a",
                  },
                ],
              },
            },
          ],
        },
      } as WorkbenchNodeAdd;
      manager.workbenchNodeAdd(node);

      expect(listenOnSnippetApply).toBeCalled();
      expect(listenOnSnippetApply.mock.calls[0][0].detail)
        .toMatchInlineSnapshot(`
        Object {
          "nodeDetails": Array [
            Object {
              "children": Array [],
              "nodeData": Object {
                "brick": "div",
                "lifeCycle": "{\\"onPageLoad\\":[{\\"useProvider\\":\\"a\\"}]}",
                "mountPoint": "bricks",
                "parent": "route-a",
                "portal": undefined,
                "properties": "{}",
                "sort": undefined,
                "type": "brick",
              },
              "nodeUid": 8,
              "parentUid": 1,
            },
          ],
          "nodeIds": Array [
            "B-002",
            null,
          ],
          "nodeUids": Array [
            2,
          ],
          "parentUid": 1,
        }
      `);
    });
    it("intert a snippet and data not update should work", () => {
      const listenOnSnippetApply = jest.fn();

      const originData = manager.getData().nodes;
      manager.onSnippetApply(listenOnSnippetApply);
      const node = {
        dragOverInstanceId: "route-a",
        parent: "route-a",
        mountPoint: "bricks",
        dragStatus: "inside",
        nodeData: {
          brick: "",
          instanceId: null,
          id: null,
          type: "brick",
          bricks: [
            {
              brick: "div",
              properties: {},
              lifeCycle: {
                onPageLoad: [
                  {
                    useProvider: "a",
                  },
                ],
              },
            },
          ],
        },
      } as WorkbenchNodeAdd;
      manager.workbenchNodeAdd(node, false);

      expect(listenOnSnippetApply).toBeCalledTimes(0);
      expect(originData).toEqual(manager.getData().nodes);
    });
  });

  it("snippet node should redirect", () => {
    const node1 = {
      parentUid: 1,
      nodeUids: [4, 6, 7, 5],
      nodeDetails: [
        {
          nodeUid: 7,
          parentUid: 1,
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
    } as EventDetailOfSnippetApply;
    manager.snippetApply(node1);

    expect(node1.nodeDetails[0].nodeData.mountPoint).toBe("bricks");

    const node2 = {
      parentUid: 2,
      nodeUids: [4, 6, 7, 5],
      nodeDetails: [
        {
          nodeUid: 7,
          parentUid: 2,
          nodeData: {
            parent: "abc",
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
    } as EventDetailOfSnippetApply;
    manager.snippetApply(node2);

    expect(node2.nodeDetails[0].nodeData.mountPoint).toBe("content");
  });

  it("updateNode should work", () => {
    const listenOnNodeUpdate = jest.fn();
    const unlistenOnNodeUpdate = manager.onNodeUpdate(listenOnNodeUpdate);

    expect(listenOnNodeUpdate).toBeCalledTimes(0);

    manager.updateNode("brick-b", {
      id: "B-003",
      type: "brick",
      brick: "basic-bricks.micro-view",
      sort: 0,
      properties: JSON.stringify({
        pagetitle: "page-1",
      }),
      mountPoint: "test-change",
      instanceId: "brick-b",
    });

    expect(
      manager.getData().nodes.find((item) => item.instanceId === "brick-b")
    ).toEqual({
      $$isTemplateInternalNode: undefined,
      $$matchedSelectors: ["basic-bricks\\.micro-view"],
      $$normalized: { brick: "basic-bricks.micro-view", iid: "brick-b" },
      $$parsedEvents: {},
      $$parsedLifeCycle: {},
      $$parsedProperties: {},
      $$uid: 5,
      alias: "micro-view",
      brick: "basic-bricks.micro-view",
      id: "B-003",
      instanceId: "brick-b",
      mountPoint: "test-change",
      properties: '{"pagetitle":"page-1"}',
      sort: 0,
      type: "brick",
    });

    expect(manager.getData().edges.find((item) => item.child === 5)).toEqual({
      $$isTemplateDelegated: true,
      $$isTemplateInternal: undefined,
      child: 5,
      mountPoint: "test-change",
      parent: 2,
      sort: 0,
    });

    expect(listenOnNodeUpdate).toBeCalledTimes(1);

    manager.updateNode("brick-b", {
      id: "B-003",
      type: "brick",
      brick: "basic-bricks.micro-view",
      sort: 0,
      properties: JSON.stringify({
        pagetitle: "page-1",
      }),
      mountPoint: undefined,
      instanceId: "brick-b",
    });

    expect(manager.getData().edges.find((item) => item.child === 5)).toEqual({
      $$isTemplateDelegated: true,
      $$isTemplateInternal: undefined,
      child: 5,
      mountPoint: "test-change",
      parent: 2,
      sort: 0,
    });

    expect(listenOnNodeUpdate).toBeCalledTimes(2);

    manager.updateNode("brick-b", {
      id: "B-003",
      type: "brick",
      brick: "basic-bricks.micro-view",
      sort: 1,
      properties: JSON.stringify({
        pagetitle: "page-2",
      }),
      mountPoint: "content",
      instanceId: "brick-b",
    });

    expect(
      manager.getData().nodes.find((item) => item.instanceId === "brick-b")
    ).toEqual({
      $$isTemplateInternalNode: undefined,
      $$matchedSelectors: ["basic-bricks\\.micro-view"],
      $$normalized: { brick: "basic-bricks.micro-view", iid: "brick-b" },
      $$parsedEvents: {},
      $$parsedLifeCycle: {},
      $$parsedProperties: {},
      $$uid: 5,
      alias: "micro-view",
      brick: "basic-bricks.micro-view",
      id: "B-003",
      instanceId: "brick-b",
      mountPoint: "content",
      properties: '{"pagetitle":"page-2"}',
      sort: 1,
      type: "brick",
    });

    expect(listenOnNodeUpdate).toBeCalledTimes(3);

    unlistenOnNodeUpdate();
  });
});
