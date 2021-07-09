import React from "react";
import { act } from "react-dom/test-utils";
import { mount } from "enzyme";
import { useDroppingStatus } from "./useDroppingStatus";
import { useBuilderDataManager } from "./useBuilderDataManager";
import { BuilderDroppingStatus } from "../interfaces";

jest.mock("./useBuilderDataManager");

let mockDroppingStatus: BuilderDroppingStatus = new Map();
const onDroppingStatusChangeListeners = new Set<() => void>();
const mockManager = {
  onDroppingStatusChange: jest.fn((fn) => {
    onDroppingStatusChangeListeners.add(fn);
    return () => onDroppingStatusChangeListeners.delete(fn);
  }),
  getDroppingStatus: () => mockDroppingStatus,
};
(useBuilderDataManager as jest.Mock).mockReturnValue(mockManager);

function TestComponent(): React.ReactElement {
  const droppingStatus = useDroppingStatus();
  return (
    <div>
      {JSON.stringify(
        Array.from(droppingStatus).map(([nodeUid, nodeStatus]) => [
          nodeUid,
          Array.from(nodeStatus),
        ])
      )}
    </div>
  );
}

describe("useDroppingStatus", () => {
  it("should work", () => {
    const wrapper = mount(<TestComponent />);
    expect(wrapper.text()).toEqual("[]");

    mockDroppingStatus = new Map([[1, new Map([["any", true]])]]);
    act(() => {
      onDroppingStatusChangeListeners.forEach((fn) => fn());
    });

    expect(wrapper.text()).toEqual('[[1,[["any",true]]]]');

    // It should remove the registered listener when component unmounted.
    wrapper.unmount();
    expect(onDroppingStatusChangeListeners.size).toBe(0);
  });
});
