import React from "react";
import { act } from "react-dom/test-utils";
import { mount } from "enzyme";
import { useHighlightNodes } from "./useHighlightNodes";
import { useBuilderDataManager } from "./useBuilderDataManager";

jest.mock("./useBuilderDataManager");

let mockHighlight = new Set([1, 2]);

const onHighlightNodesChangeListeners = new Set<() => void>();
const mockManager = {
  onHighlightNodesChange: jest.fn((fn) => {
    onHighlightNodesChangeListeners.add(fn);
    return () => onHighlightNodesChangeListeners.delete(fn);
  }),
  getHighlightNodes: () => mockHighlight,
};
(useBuilderDataManager as jest.Mock).mockReturnValue(mockManager);

function TestComponent(): React.ReactElement {
  const data = useHighlightNodes();
  return <div>{data}</div>;
}

describe("useHighlightNodes", () => {
  it("should work", () => {
    const wrapper = mount(<TestComponent />);
    expect(wrapper.text()).toMatchInlineSnapshot(`"12"`);

    mockHighlight = new Set([2, 3]);

    act(() => {
      onHighlightNodesChangeListeners.forEach((fn) => fn());
    });

    expect(wrapper.text()).toMatchInlineSnapshot(`"23"`);

    // It should remove the registered listener when component unmounted.
    wrapper.unmount();
    expect(onHighlightNodesChangeListeners.size).toBe(0);
  });
});
