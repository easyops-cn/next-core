import React from "react";
import { act } from "react-dom/test-utils";
import { mount } from "enzyme";
import { useCurrentDraggingFamily } from "./useCurrentDraggingFamily";
import { useBuilderData } from "./useBuilderData";
import { BuilderEventType } from "../interfaces";

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

const mockAddEventListener = jest.spyOn(window, "addEventListener");
const mockRemoveEventListener = jest.spyOn(window, "removeEventListener");

function TestComponent(): React.ReactElement {
  const family = useCurrentDraggingFamily();
  return <div>{family.sort().join(",")}</div>;
}

describe("useCurrentDraggingFamily", () => {
  it("should work", () => {
    const wrapper = mount(<TestComponent />);
    expect(wrapper.text()).toBe("");

    act(() => {
      window.dispatchEvent(
        new CustomEvent(BuilderEventType.NODE_DRAG_START, {
          detail: {
            nodeUid: 4,
          },
        })
      );
    });
    expect(wrapper.text()).toBe("4,6,7");

    act(() => {
      window.dispatchEvent(
        new CustomEvent(BuilderEventType.NODE_DRAG_START, {
          detail: {
            nodeUid: 2,
          },
        })
      );
    });
    expect(wrapper.text()).toBe("2,4,5,6,7");

    // It should remove the registered listener when component unmounted.
    wrapper.unmount();
    expect(mockRemoveEventListener).toBeCalledWith(
      ...mockAddEventListener.mock.calls[0]
    );
  });
});
