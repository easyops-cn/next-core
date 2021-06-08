import React from "react";
import { act } from "react-dom/test-utils";
import { mount } from "enzyme";
import { useHighlighted } from "./useHighlighted";
import { useBuilderDataManager } from "./useBuilderDataManager";

jest.mock("./useBuilderDataManager");

const mockHighlightNodes = new Set();

const onHighlightNodesChangeListeners = new Set<() => void>();
const mockManager = {
  onHighlightNodesChange: jest.fn((fn) => {
    onHighlightNodesChangeListeners.add(fn);
    return () => onHighlightNodesChangeListeners.delete(fn);
  }),
  isHighlighted: (nodeUid: number) => mockHighlightNodes.has(nodeUid),
};
(useBuilderDataManager as jest.Mock).mockReturnValue(mockManager);

function TestComponent(props: { nodeUid: number }): React.ReactElement {
  const highlighted = useHighlighted(props.nodeUid);
  return <div>{highlighted ? "yes" : "no"}</div>;
}

describe("useHighlighted", () => {
  it("should work", () => {
    const wrapper = mount(<TestComponent nodeUid={1} />);
    expect(wrapper.text()).toBe("no");

    mockHighlightNodes.add(1);

    act(() => {
      onHighlightNodesChangeListeners.forEach((fn) => fn());
    });

    expect(wrapper.text()).toBe("yes");

    // It should remove the registered listener when component unmounted.
    wrapper.unmount();
    expect(onHighlightNodesChangeListeners.size).toBe(0);
  });
});
