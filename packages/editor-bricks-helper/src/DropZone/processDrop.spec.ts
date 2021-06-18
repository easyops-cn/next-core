import {
  BuilderDataTransferType,
  BuilderGroupedChildNode,
} from "../interfaces";
import { processDrop } from "./processDrop";
import { getUniqueNodeId } from "../internal/getUniqueNodeId";

jest.mock("../internal/getUniqueNodeId");

const mockGetUniqueNodeId = (
  getUniqueNodeId as jest.MockedFunction<typeof getUniqueNodeId>
).mockReturnValue(200);

describe("processDrop", () => {
  const droppingSiblingGroups: BuilderGroupedChildNode[] = [
    {
      mountPoint: "toolbar",
      childNodes: [
        {
          $$uid: 1,
          id: "B-001",
          type: "brick",
          brick: "general-button",
        },
        {
          $$uid: 2,
          id: "B-002",
          type: "brick",
          brick: "general-select",
        },
      ],
    },
    {
      mountPoint: "content",
      childNodes: [
        {
          $$uid: 3,
          id: "B-003",
          type: "brick",
          brick: "general-card",
        },
        {
          $$uid: 4,
          id: "B-004",
          type: "brick",
          brick: "brick-table",
        },
        {
          $$uid: 5,
          id: "B-005",
          type: "brick",
          brick: "grid-layout",
        },
      ],
    },
  ];

  const manager = {
    nodeAdd: jest.fn(),
    nodeMove: jest.fn(),
    nodeReorder: jest.fn(),
    snippetApply: jest.fn(),
  } as any;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should add a node of brick", () => {
    processDrop({
      type: BuilderDataTransferType.NODE_TO_ADD,
      data: {
        brick: "basic-bricks.new-brick",
      },
      droppingIndex: 1,
      droppingParentUid: 100,
      droppingParentInstanceId: "instance-a",
      droppingMountPoint: "toolbar",
      droppingChildNodes: droppingSiblingGroups[0].childNodes,
      droppingSiblingGroups,
      isPortalCanvas: false,
      manager,
    });
    expect(manager.nodeAdd).toBeCalledWith({
      nodeUid: 200,
      parentUid: 100,
      nodeAlias: "new-brick",
      nodeData: {
        parent: "instance-a",
        type: "brick",
        brick: "basic-bricks.new-brick",
        mountPoint: "toolbar",
        portal: false,
      },
      nodeUids: [1, 200, 2, 3, 4, 5],
      nodeIds: ["B-001", null, "B-002", "B-003", "B-004", "B-005"],
    });
  });

  it("should add a node of brick in portal canvas", () => {
    processDrop({
      type: BuilderDataTransferType.NODE_TO_ADD,
      data: {
        brick: "basic-bricks.new-brick",
      },
      droppingIndex: 1,
      droppingParentUid: 100,
      droppingParentInstanceId: "instance-a",
      droppingMountPoint: "toolbar",
      droppingChildNodes: droppingSiblingGroups[0].childNodes,
      droppingSiblingGroups,
      isPortalCanvas: true,
      manager,
    });
    expect(manager.nodeAdd).toBeCalledWith({
      nodeUid: 200,
      parentUid: 100,
      nodeAlias: "new-brick",
      nodeData: {
        parent: "instance-a",
        type: "brick",
        brick: "basic-bricks.new-brick",
        mountPoint: "toolbar",
        portal: true,
      },
      nodeUids: [1, 200, 2, 3, 4, 5],
      nodeIds: ["B-001", null, "B-002", "B-003", "B-004", "B-005"],
    });
  });

  it("should add a node of legacy template", () => {
    processDrop({
      type: BuilderDataTransferType.NODE_TO_ADD,
      data: {
        brick: "basic-bricks.new-brick",
        brickType: "template",
      },
      droppingIndex: 1,
      droppingParentUid: 100,
      droppingParentInstanceId: "instance-a",
      droppingMountPoint: "toolbar",
      droppingChildNodes: droppingSiblingGroups[0].childNodes,
      droppingSiblingGroups,
      manager,
    });
    expect(manager.nodeAdd).toBeCalledWith({
      nodeUid: 200,
      parentUid: 100,
      nodeAlias: "new-brick",
      nodeData: {
        parent: "instance-a",
        type: "template",
        brick: "basic-bricks.new-brick",
        mountPoint: "toolbar",
      },
      nodeUids: [1, 200, 2, 3, 4, 5],
      nodeIds: ["B-001", null, "B-002", "B-003", "B-004", "B-005"],
    });
  });

  it("should add a node of provider", () => {
    processDrop({
      type: BuilderDataTransferType.NODE_TO_ADD,
      data: {
        brick: "basic-bricks.new-brick",
        brickType: "provider",
      },
      droppingIndex: 1,
      droppingParentUid: 100,
      droppingParentInstanceId: "instance-a",
      droppingMountPoint: "toolbar",
      droppingChildNodes: droppingSiblingGroups[0].childNodes,
      droppingSiblingGroups,
      manager,
    });
    expect(manager.nodeAdd).toBeCalledWith({
      nodeUid: 200,
      parentUid: 100,
      nodeAlias: "new-brick",
      nodeData: {
        parent: "instance-a",
        type: "provider",
        brick: "basic-bricks.new-brick",
        mountPoint: "toolbar",
        bg: true,
      },
      nodeUids: [1, 200, 2, 3, 4, 5],
      nodeIds: ["B-001", null, "B-002", "B-003", "B-004", "B-005"],
    });
  });

  it("should apply a snippet", () => {
    mockGetUniqueNodeId.mockReturnValueOnce(200);
    mockGetUniqueNodeId.mockReturnValueOnce(201);
    mockGetUniqueNodeId.mockReturnValueOnce(202);
    processDrop({
      type: BuilderDataTransferType.SNIPPET_TO_APPLY,
      data: {
        bricks: [
          {
            brick: "basic-bricks.easy-view",
            properties: {
              containerStyle: {
                gap: "var(--page-card-gap)",
              },
            },
            slots: {
              header: {
                bricks: [
                  {
                    brick: "basic-bricks.general-button",
                    events: {
                      click: {
                        action: "console.log",
                      },
                    },
                    bg: true,
                  },
                ],
                type: "bricks",
              },
              footer: {
                bricks: [{ template: "my.legacy-template" }],
                type: "bricks",
              },
            },
            permissionsPreCheck: ["admin"],
          },
        ],
      },
      droppingIndex: 1,
      droppingParentUid: 100,
      droppingParentInstanceId: "instance-a",
      droppingMountPoint: "toolbar",
      droppingChildNodes: droppingSiblingGroups[0].childNodes,
      droppingSiblingGroups,
      manager,
    });
    expect(manager.snippetApply).toBeCalledWith({
      parentUid: 100,
      nodeDetails: [
        {
          nodeUid: 200,
          parentUid: 100,
          nodeAlias: "easy-view",
          nodeData: {
            parent: "instance-a",
            type: "brick",
            brick: "basic-bricks.easy-view",
            mountPoint: "toolbar",
            properties: '{"containerStyle":{"gap":"var(--page-card-gap)"}}',
            permissionsPreCheck: "- admin\n",
          },
          children: [
            {
              nodeUid: 201,
              parentUid: 200,
              nodeAlias: "general-button",
              nodeData: {
                type: "provider",
                brick: "basic-bricks.general-button",
                mountPoint: "header",
                bg: true,
                events: '{"click":{"action":"console.log"}}',
                sort: 0,
              },
              children: [],
            },
            {
              nodeUid: 202,
              parentUid: 200,
              nodeAlias: "legacy-template",
              nodeData: {
                type: "template",
                brick: "my.legacy-template",
                mountPoint: "footer",
                sort: 1,
              },
              children: [],
            },
          ],
        },
      ],
      nodeUids: [1, 200, 2, 3, 4, 5],
      nodeIds: ["B-001", null, "B-002", "B-003", "B-004", "B-005"],
    });
  });

  it("should move a node inside a mount point", () => {
    processDrop({
      type: BuilderDataTransferType.NODE_TO_MOVE,
      data: {
        nodeUid: 4,
        nodeId: "B-004",
        nodeInstanceId: "instance-b",
      },
      droppingIndex: 0,
      droppingParentUid: 100,
      droppingParentInstanceId: "instance-a",
      droppingMountPoint: "content",
      droppingChildNodes: droppingSiblingGroups[1].childNodes,
      droppingSiblingGroups,
      manager,
    });
    expect(manager.nodeReorder).toBeCalledWith({
      parentUid: 100,
      nodeUids: [1, 2, 4, 3, 5],
      nodeIds: ["B-001", "B-002", "B-004", "B-003", "B-005"],
    });
  });

  it("should do nothing if order is not changed (droppingIndex === originalIndex)", () => {
    processDrop({
      type: BuilderDataTransferType.NODE_TO_MOVE,
      data: {
        nodeUid: 4,
        nodeId: "B-004",
        nodeInstanceId: "instance-b",
      },
      droppingIndex: 1,
      droppingParentUid: 100,
      droppingParentInstanceId: "instance-a",
      droppingMountPoint: "content",
      droppingChildNodes: droppingSiblingGroups[1].childNodes,
      droppingSiblingGroups,
      manager,
    });
    expect(manager.nodeAdd).not.toBeCalled();
    expect(manager.nodeMove).not.toBeCalled();
    expect(manager.nodeReorder).not.toBeCalled();
  });

  it("should do nothing if order is not changed (droppingIndex === originalIndex + 1)", () => {
    processDrop({
      type: BuilderDataTransferType.NODE_TO_MOVE,
      data: {
        nodeUid: 4,
        nodeId: "B-004",
        nodeInstanceId: "instance-b",
      },
      droppingIndex: 2,
      droppingParentUid: 100,
      droppingParentInstanceId: "instance-a",
      droppingMountPoint: "content",
      droppingChildNodes: droppingSiblingGroups[1].childNodes,
      droppingSiblingGroups,
      manager,
    });
    expect(manager.nodeAdd).not.toBeCalled();
    expect(manager.nodeMove).not.toBeCalled();
    expect(manager.nodeReorder).not.toBeCalled();
  });

  it("should move a node across mount points", () => {
    processDrop({
      type: BuilderDataTransferType.NODE_TO_MOVE,
      data: {
        nodeUid: 4,
        nodeId: "B-004",
        nodeInstanceId: "instance-b",
      },
      droppingIndex: 1,
      droppingParentUid: 100,
      droppingParentInstanceId: "instance-a",
      droppingMountPoint: "toolbar",
      droppingChildNodes: droppingSiblingGroups[0].childNodes,
      droppingSiblingGroups,
      manager,
    });
    expect(manager.nodeMove).toBeCalledWith({
      nodeUid: 4,
      parentUid: 100,
      nodeInstanceId: "instance-b",
      nodeUids: [1, 4, 2, 3, 5],
      nodeIds: ["B-001", "B-004", "B-002", "B-003", "B-005"],
      nodeData: {
        parent: "instance-a",
        mountPoint: "toolbar",
      },
    });
  });

  it("should do nothing if type is unexpected", () => {
    processDrop({
      type: "unexpected" as any,
      data: {
        nodeUid: 4,
        nodeId: "B-004",
        nodeInstanceId: "instance-b",
      },
      droppingIndex: 2,
      droppingParentUid: 100,
      droppingParentInstanceId: "instance-a",
      droppingMountPoint: "content",
      droppingChildNodes: droppingSiblingGroups[1].childNodes,
      droppingSiblingGroups,
      manager,
    });
    expect(manager.nodeAdd).not.toBeCalled();
    expect(manager.nodeMove).not.toBeCalled();
    expect(manager.nodeReorder).not.toBeCalled();
  });
});
