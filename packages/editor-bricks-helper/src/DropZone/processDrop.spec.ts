import {
  BuilderDataTransferType,
  BuilderGroupedChildNode,
} from "../interfaces";
import { processDrop } from "./processDrop";
import { getUniqueNodeId } from "../internal/getUniqueNodeId";

jest.mock("../internal/getUniqueNodeId");

(getUniqueNodeId as jest.MockedFunction<
  typeof getUniqueNodeId
>).mockReturnValue(200);

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
  } as any;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should add a node", () => {
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
      },
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
