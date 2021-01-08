import React from "react";
import { shallow } from "enzyme";
import { useBuilderParentNode } from "./useBuilderParentNode";
import { useBuilderData } from "./useBuilderData";
import { BuilderRuntimeNode } from "../interfaces";

jest.mock("./useBuilderData");

(useBuilderData as jest.MockedFunction<typeof useBuilderData>).mockReturnValue({
  rootId: 1,
  nodes: ([
    {
      $$uid: 1,
    },
    {
      $$uid: 2,
    },
    {
      $$uid: 3,
    },
  ] as Partial<BuilderRuntimeNode>[]) as BuilderRuntimeNode[],
  edges: [
    {
      parent: 1,
      child: 2,
      mountPoint: "toolbar",
      sort: 0,
    },
    {
      parent: 2,
      child: 3,
      mountPoint: "content",
      sort: 0,
    },
  ],
});

function TestComponent(props: { nodeUid: number }): React.ReactElement {
  const parentNode = useBuilderParentNode(props.nodeUid);
  return <div>{parentNode?.$$uid}</div>;
}

describe("useBuilderParentNode", () => {
  it.each<[number, number]>([
    [3, 2],
    [2, 1],
  ])("should work", (nodeUid, parentUid) => {
    const wrapper = shallow(<TestComponent nodeUid={nodeUid} />);
    expect(wrapper.text()).toBe(String(parentUid));
  });
});
