import {
  BuilderDataTransferType,
  BuilderEventType,
  BuilderGroupedChildNode,
} from "../interfaces";
import { processDrop } from "./processDrop";
import { getUniqueNodeId } from "../internal/getUniqueNodeId";

jest.mock("../internal/getUniqueNodeId");

(getUniqueNodeId as jest.MockedFunction<
  typeof getUniqueNodeId
>).mockReturnValue(200);

jest.spyOn(window, "dispatchEvent").mockImplementation(() => void 0);

describe("processDrop", () => {
  const groupedChildNodes: BuilderGroupedChildNode[] = [
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

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should add a node", () => {
    processDrop({
      type: BuilderDataTransferType.NODE_TO_ADD,
      data: {
        brick: "basic-bricks.new-brick",
      },
      dropIndex: 1,
      parentUid: 100,
      parentInstanceId: "instance-a",
      mountPoint: "toolbar",
      selfChildNodes: groupedChildNodes[0].childNodes,
      groupedChildNodes,
    });
    expect(window.dispatchEvent).toBeCalledWith(
      expect.objectContaining({
        type: BuilderEventType.NODE_ADD,
        detail: {
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
        },
      })
    );
  });

  it("should move a node inside a mount point", () => {
    processDrop({
      type: BuilderDataTransferType.NODE_TO_MOVE,
      data: {
        nodeUid: 4,
        nodeId: "B-004",
        nodeInstanceId: "instance-b",
      },
      dropIndex: 0,
      parentUid: 100,
      parentInstanceId: "instance-a",
      mountPoint: "content",
      selfChildNodes: groupedChildNodes[1].childNodes,
      groupedChildNodes,
    });
    expect(window.dispatchEvent).toBeCalledWith(
      expect.objectContaining({
        type: BuilderEventType.NODE_REORDER,
        detail: {
          parentUid: 100,
          mountPoint: "content",
          nodeUids: [1, 2, 4, 3, 5],
          nodeIds: ["B-001", "B-002", "B-004", "B-003", "B-005"],
        },
      })
    );
  });

  it("should do nothing order is not changed (dropIndex === originalIndex)", () => {
    processDrop({
      type: BuilderDataTransferType.NODE_TO_MOVE,
      data: {
        nodeUid: 4,
        nodeId: "B-004",
        nodeInstanceId: "instance-b",
      },
      dropIndex: 1,
      parentUid: 100,
      parentInstanceId: "instance-a",
      mountPoint: "content",
      selfChildNodes: groupedChildNodes[1].childNodes,
      groupedChildNodes,
    });
    expect(window.dispatchEvent).not.toBeCalled();
  });

  it("should do nothing order is not changed (dropIndex === originalIndex + 1)", () => {
    processDrop({
      type: BuilderDataTransferType.NODE_TO_MOVE,
      data: {
        nodeUid: 4,
        nodeId: "B-004",
        nodeInstanceId: "instance-b",
      },
      dropIndex: 2,
      parentUid: 100,
      parentInstanceId: "instance-a",
      mountPoint: "content",
      selfChildNodes: groupedChildNodes[1].childNodes,
      groupedChildNodes,
    });
    expect(window.dispatchEvent).not.toBeCalled();
  });

  it("should move a node across mount points", () => {
    processDrop({
      type: BuilderDataTransferType.NODE_TO_MOVE,
      data: {
        nodeUid: 4,
        nodeId: "B-004",
        nodeInstanceId: "instance-b",
      },
      dropIndex: 1,
      parentUid: 100,
      parentInstanceId: "instance-a",
      mountPoint: "toolbar",
      selfChildNodes: groupedChildNodes[0].childNodes,
      groupedChildNodes,
    });
    expect(window.dispatchEvent).toBeCalledWith(
      expect.objectContaining({
        type: BuilderEventType.NODE_MOVE,
        detail: {
          nodeUid: 4,
          parentUid: 100,
          nodeInstanceId: "instance-b",
          nodeUids: [1, 4, 2, 3, 5],
          nodeIds: ["B-001", "B-004", "B-002", "B-003", "B-005"],
          nodeData: {
            parent: "instance-a",
            mountPoint: "toolbar",
          },
        },
      })
    );
  });

  it("should do nothing if type is unexpected", () => {
    processDrop({
      type: "unexpected" as any,
      data: {
        nodeUid: 4,
        nodeId: "B-004",
        nodeInstanceId: "instance-b",
      },
      dropIndex: 2,
      parentUid: 100,
      parentInstanceId: "instance-a",
      mountPoint: "content",
      selfChildNodes: groupedChildNodes[1].childNodes,
      groupedChildNodes,
    });
    expect(window.dispatchEvent).not.toBeCalled();
  });
});
