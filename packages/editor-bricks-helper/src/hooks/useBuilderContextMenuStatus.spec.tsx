import React from "react";
import { act } from "react-dom/test-utils";
import { mount } from "enzyme";
import { useBuilderContextMenuStatus } from "./useBuilderContextMenuStatus";
import { useBuilderDataManager } from "./useBuilderDataManager";
import { BuilderContextMenuStatus } from "../interfaces";

jest.mock("./useBuilderDataManager");

let mockStatus: BuilderContextMenuStatus = {
  active: false,
};
const onContextMenuChangeListeners = new Set<() => void>();
const mockManager = {
  onContextMenuChange: jest.fn((fn) => {
    onContextMenuChangeListeners.add(fn);
    return () => onContextMenuChangeListeners.delete(fn);
  }),
  getContextMenuStatus: () => mockStatus,
};
(useBuilderDataManager as jest.Mock).mockReturnValue(mockManager);

function TestComponent(): React.ReactElement {
  const { active } = useBuilderContextMenuStatus();
  return <div>{JSON.stringify(active)}</div>;
}

describe("useBuilderContextMenuStatus", () => {
  it("should work", () => {
    const wrapper = mount(<TestComponent />);
    expect(wrapper.text()).toBe("false");

    mockStatus = {
      active: true,
    };
    act(() => {
      onContextMenuChangeListeners.forEach((fn) => fn());
    });

    expect(wrapper.text()).toBe("true");

    // It should remove the registered listener when component unmounted.
    wrapper.unmount();
    expect(onContextMenuChangeListeners.size).toBe(0);
  });
});
