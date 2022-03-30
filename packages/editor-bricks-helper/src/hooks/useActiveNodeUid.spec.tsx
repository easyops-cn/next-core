import React from "react";
import { act } from "react-dom/test-utils";
import { mount } from "enzyme";
import { useActiveNodeUid } from "./useActiveNodeUid";
import { useBuilderDataManager } from "./useBuilderDataManager";

jest.mock("./useBuilderDataManager");

let mockActiveUid = 1;

const onActiveNodeChangeListeners = new Set<() => void>();
const mockManager = {
  onActiveNodeChange: jest.fn((fn) => {
    onActiveNodeChangeListeners.add(fn);
    return () => onActiveNodeChangeListeners.delete(fn);
  }),
  getActiveNodeUid: () => mockActiveUid,
};
(useBuilderDataManager as jest.Mock).mockReturnValue(mockManager);

function TestComponent(): React.ReactElement {
  const data = useActiveNodeUid();
  return <div>{data}</div>;
}

describe("useActiveNodeUid", () => {
  it("should work", () => {
    const wrapper = mount(<TestComponent />);
    expect(wrapper.text()).toBe("1");

    mockActiveUid = 2;

    act(() => {
      onActiveNodeChangeListeners.forEach((fn) => fn());
    });

    expect(wrapper.text()).toBe("2");

    // It should remove the registered listener when component unmounted.
    wrapper.unmount();
    expect(onActiveNodeChangeListeners.size).toBe(0);
  });
});
