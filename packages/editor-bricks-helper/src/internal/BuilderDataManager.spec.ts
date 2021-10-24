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
    // @ts-ignore
    jest.spyOn(manager.storiesCache, "install").mockImplementation(jest.fn());
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
}
`);
  });

  it("should add node", async () => {
    const listenOnNodeAdd = jest.fn();
    const listenOnDataChange = jest.fn();
    const unlistenOnNodeAdd = manager.onNodeAdd(listenOnNodeAdd);
    const unlistenOnDataChange = manager.onDataChange(listenOnDataChange);
    await manager.nodeAdd({
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

  it("should update stored node", async () => {
    const listenOnDataChange = jest.fn();
    const unlistenOnDataChange = manager.onDataChange(listenOnDataChange);
    await manager.nodeAdd({
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
        id: "forms.general-input",
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
        id: "basic-bricks.general-card",
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
        id: "forms.general-input",
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
        id: "basic-bricks.general-card",
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

describe("StorieCache install should work", () => {
  const mockInstall = jest.fn();

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const BuilderDataManager = require("./BuilderDataManager").BuilderDataManager;
  const manager = new BuilderDataManager();
  // @ts-ignore
  jest.spyOn(manager.storiesCache, "install").mockImplementation(mockInstall);
  manager.storyListInit([
    {
      id: "brick-a",
      type: "brick",
      examples: [],
    },
    {
      id: "brick-b",
      type: "brick",
      examples: [],
    },
  ] as Partial<Story>[] as Story[]);
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
            id: "B-006",
            type: "brick",
            brick: "widget-a",
            mountPoint: "content",
          },
        ],
      },
    ],
  });

  it("install should work", () => {
    expect(mockInstall).toBeCalledTimes(1);
    expect(mockInstall.mock.calls).toEqual([
      [
        {
          fields: ["id", "doc", "examples", "originData"],
          list: ["brick-a", "widget-a", "brick-b"],
        },
        true,
      ],
    ]);
  });

  it("nodeAdd should work", () => {
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

    expect(mockInstall).toBeCalledTimes(2);
    expect(mockInstall.mock.calls[mockInstall.mock.calls.length - 1]).toEqual([
      {
        fields: ["id", "doc", "examples", "originData"],
        list: ["my.any-brick"],
      },
      true,
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
