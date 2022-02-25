import React from "react";
import { shallow } from "enzyme";
import { range } from "lodash";
import { useBuilderGroupedChildNodes } from "./useBuilderGroupedChildNodes";
import { useBuilderData } from "./useBuilderData";
import { BuilderRuntimeNode } from "../interfaces";

jest.mock("./useBuilderData");

// Given a tree:
// - 1:
//   - toolbar:
//     - 2
//   - content:
//     - 3
//       - content
//         - 5
//           - <template-internal>
//             - 6
//           - items
//             - 7
//     - 4
(useBuilderData as jest.MockedFunction<typeof useBuilderData>).mockReturnValue({
  rootId: 1,
  nodes: range(1, 8).map(
    ($$uid) =>
      ({
        $$uid,
      } as Partial<BuilderRuntimeNode> as BuilderRuntimeNode)
  ),
  edges: [
    {
      parent: 1,
      child: 2,
      mountPoint: "toolbar",
      sort: 0,
    },
    {
      parent: 1,
      child: 3,
      mountPoint: "content",
      sort: 1,
    },
    {
      parent: 1,
      child: 4,
      mountPoint: "content",
      sort: 2,
    },
    {
      parent: 3,
      child: 5,
      mountPoint: "content",
      sort: 0,
    },
    {
      parent: 5,
      child: 6,
      mountPoint: "<internal>",
      sort: 0,
      $$isTemplateInternal: true,
    },
    {
      parent: 5,
      child: 7,
      mountPoint: "items",
      sort: 1,
      $$isTemplateDelegated: true,
    },
  ],
  wrapperNode: {
    $$uid: 3,
  } as BuilderRuntimeNode,
});

function TestComponent(
  props: Parameters<typeof useBuilderGroupedChildNodes>[0]
): React.ReactElement {
  const mountPoints = useBuilderGroupedChildNodes(props);
  return (
    <div>
      {mountPoints
        .map(
          (item) =>
            `${item.mountPoint}:${item.childNodes
              .map((node) => node.$$uid)
              .join(",")}`
        )
        .join(";")}
    </div>
  );
}

describe("useBuilderGroupedChildNodes", () => {
  it.each<[Parameters<typeof useBuilderGroupedChildNodes>[0], string]>([
    [
      {
        isRoot: true,
      },
      "toolbar:2;content:3,4",
    ],
    [
      {
        nodeUid: 3,
      },
      "content:5",
    ],
    [
      {
        nodeUid: 5,
      },
      "<internal>:6",
    ],
    [
      {
        nodeUid: 5,
        doNotExpandTemplates: true,
      },
      "items:7",
    ],
    [
      {
        isRoot: true,
        useWrapper: true,
      },
      "bricks:5",
    ],
  ])("should work", (props, stringUid) => {
    const wrapper = shallow(<TestComponent {...props} />);
    expect(wrapper.text()).toBe(stringUid);
  });
});
