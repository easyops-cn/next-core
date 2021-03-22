import React from "react";
import { act } from "react-dom/test-utils";
import { mount } from "enzyme";
import { useShowRelatedNodesBasedOnEvents } from "./useShowRelatedNodesBasedOnEvents";
import { useBuilderDataManager } from "./useBuilderDataManager";

jest.mock("./useBuilderDataManager");

let mockShowRelatedNodesBasedOnEvents = false;

const onShowRelatedNodesBasedOnEventsChangeListeners = new Set<() => void>();
const mockManager = {
  onShowRelatedNodesBasedOnEventsChange: jest.fn((fn) => {
    onShowRelatedNodesBasedOnEventsChangeListeners.add(fn);
    return () => onShowRelatedNodesBasedOnEventsChangeListeners.delete(fn);
  }),
  getShowRelatedNodesBasedOnEvents: () => mockShowRelatedNodesBasedOnEvents,
};
(useBuilderDataManager as jest.Mock).mockReturnValue(mockManager);

function TestComponent(): React.ReactElement {
  const data = useShowRelatedNodesBasedOnEvents();
  return <div>{JSON.stringify(data)}</div>;
}

describe("useHoverNodeUid", () => {
  it("should work", () => {
    const wrapper = mount(<TestComponent />);
    expect(wrapper.text()).toMatchInlineSnapshot(`"false"`);

    mockShowRelatedNodesBasedOnEvents = true;

    act(() => {
      onShowRelatedNodesBasedOnEventsChangeListeners.forEach((fn) => fn());
    });

    expect(wrapper.text()).toMatchInlineSnapshot(`"true"`);

    // It should remove the registered listener when component unmounted.
    wrapper.unmount();
    expect(onShowRelatedNodesBasedOnEventsChangeListeners.size).toBe(0);
  });
});
