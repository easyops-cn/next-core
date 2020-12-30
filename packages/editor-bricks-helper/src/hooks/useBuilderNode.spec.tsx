import React from "react";
import { shallow } from "enzyme";
import { useBuilderNode } from "./useBuilderNode";
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
  ] as Partial<BuilderRuntimeNode>[]) as BuilderRuntimeNode[],
  edges: [],
});

function TestComponent(
  props: Parameters<typeof useBuilderNode>[0]
): React.ReactElement {
  const node = useBuilderNode(props);
  return <div>{node?.$$uid}</div>;
}

describe("useBuilderNode", () => {
  it.each<[Parameters<typeof useBuilderNode>[0], string]>([
    [
      {
        isRoot: true,
      },
      "1",
    ],
    [
      {
        nodeUid: 2,
      },
      "2",
    ],
    [
      {
        nodeUid: 3,
      },
      "",
    ],
  ])("should work", (props, stringUid) => {
    const wrapper = shallow(<TestComponent {...props} />);
    expect(wrapper.text()).toBe(stringUid);
  });
});
