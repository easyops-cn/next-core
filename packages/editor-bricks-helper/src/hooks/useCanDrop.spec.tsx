import React from "react";
import { shallow } from "enzyme";
import { useCanDrop } from "./useCanDrop";
import { useBuilderData } from "./useBuilderData";

jest.mock("./useBuilderData");

// Given a tree:
//       1
//      ↙ ↘
//     2   3
//    ↙ ↘
//   4   5
//  ↙ ↘
// 6   7
(useBuilderData as jest.MockedFunction<typeof useBuilderData>).mockReturnValue({
  rootId: 1,
  nodes: [],
  edges: [
    {
      parent: 1,
      child: 2,
      mountPoint: "x",
      sort: 0,
    },
    {
      parent: 1,
      child: 3,
      mountPoint: "x",
      sort: 0,
    },
    {
      parent: 2,
      child: 4,
      mountPoint: "x",
      sort: 0,
    },
    {
      parent: 2,
      child: 5,
      mountPoint: "x",
      sort: 0,
    },
    {
      parent: 4,
      child: 6,
      mountPoint: "x",
      sort: 0,
    },
    {
      parent: 4,
      child: 7,
      mountPoint: "x",
      sort: 0,
    },
  ],
});

function TestComponent({
  draggingUid,
  nodeUid,
}: {
  draggingUid: number;
  nodeUid: number;
}): React.ReactElement {
  const canDrop = useCanDrop();
  return <div>{String(canDrop(draggingUid, nodeUid))}</div>;
}

describe("useCanDrop", () => {
  it.each<[number, number, boolean]>([
    [4, 4, false],
    [4, 6, false],
    [4, 7, false],
    [4, 1, true],
    [4, 2, true],
    [4, 3, true],
    [4, 5, true],
    [2, 2, false],
    [2, 4, false],
    [2, 5, false],
    [2, 6, false],
    [2, 7, false],
    [2, 1, true],
    [2, 3, true],
  ])("", (draggingUid, nodeUid, canDrop) => {
    const wrapper = shallow(
      <TestComponent draggingUid={draggingUid} nodeUid={nodeUid} />
    );
    expect(wrapper.text()).toBe(String(canDrop));
  });
});
