import React from "react";
import { act } from "react-dom/test-utils";
import { mount } from "enzyme";
import { useHoverNodeUid } from "./useHoverNodeUid";
import { useBuilderDataManager } from "./useBuilderDataManager";

jest.mock("./useBuilderDataManager");

let mockHoverUid = 1;

const onHoverNodeChangeListeners = new Set<() => void>();
const mockManager = {
  onHoverNodeChange: jest.fn((fn) => {
    onHoverNodeChangeListeners.add(fn);
    return () => onHoverNodeChangeListeners.delete(fn);
  }),
  getHoverNodeUid: () => mockHoverUid,
};
(useBuilderDataManager as jest.Mock).mockReturnValue(mockManager);

function TestComponent(): React.ReactElement {
  const data = useHoverNodeUid();
  return <div>{data}</div>;
}

describe("useHoverNodeUid", () => {
  it("should work", () => {
    const wrapper = mount(<TestComponent />);
    expect(wrapper.text()).toMatchInlineSnapshot(`"1"`);

    mockHoverUid = 2;

    act(() => {
      onHoverNodeChangeListeners.forEach((fn) => fn());
    });

    expect(wrapper.text()).toMatchInlineSnapshot(`"2"`);

    // It should remove the registered listener when component unmounted.
    wrapper.unmount();
    expect(onHoverNodeChangeListeners.size).toBe(0);
  });
});
