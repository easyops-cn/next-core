import { BuilderGroupedChildNode } from "../interfaces";
import { getSortedIdsAfterDropped } from "./getSortedIdsAfterDropped";

describe("getSortedIdsAfterDropped", () => {
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

  it("should move backward a node", () => {
    expect(
      getSortedIdsAfterDropped({
        draggingNodeUid: 4,
        draggingNodeId: "B-004",
        draggingIndex: 1,
        droppingMountPoint: "content",
        droppingSiblingGroups,
        droppingIndex: 0,
      })
    ).toEqual({
      nodeUids: [1, 2, 4, 3, 5],
      nodeIds: ["B-001", "B-002", "B-004", "B-003", "B-005"],
    });
  });

  it("should move forward a node", () => {
    expect(
      getSortedIdsAfterDropped({
        draggingNodeUid: 4,
        draggingNodeId: "B-004",
        draggingIndex: 1,
        droppingMountPoint: "content",
        droppingSiblingGroups,
        droppingIndex: 3,
      })
    ).toEqual({
      nodeUids: [1, 2, 3, 5, 4],
      nodeIds: ["B-001", "B-002", "B-003", "B-005", "B-004"],
    });
  });

  it("should move a node across mount points", () => {
    expect(
      getSortedIdsAfterDropped({
        draggingNodeUid: 4,
        draggingNodeId: "B-004",
        droppingMountPoint: "toolbar",
        droppingSiblingGroups,
        droppingIndex: 1,
      })
    ).toEqual({
      nodeUids: [1, 4, 2, 3, 5],
      nodeIds: ["B-001", "B-004", "B-002", "B-003", "B-005"],
    });
  });

  it("should add a node", () => {
    expect(
      getSortedIdsAfterDropped({
        draggingNodeUid: 6,
        draggingNodeId: null,
        droppingMountPoint: "toolbar",
        droppingSiblingGroups,
        droppingIndex: 1,
      })
    ).toEqual({
      nodeUids: [1, 6, 2, 3, 4, 5],
      nodeIds: ["B-001", null, "B-002", "B-003", "B-004", "B-005"],
    });
  });
});
