import React from "react";
import { act } from "react-dom/test-utils";
import { mount } from "enzyme";
import { useOutlineEnabled } from "./useOutlineEnabled";
import { useBuilderDataManager } from "./useBuilderDataManager";

jest.mock("./useBuilderDataManager");

const mockOutlineDisabledNodes = new Set<string>();

const onOutlineEnabledNodesChangeListeners = new Set<() => void>();
const mockManager = {
  onOutlineEnabledNodesChange: jest.fn((fn) => {
    onOutlineEnabledNodesChangeListeners.add(fn);
    return () => onOutlineEnabledNodesChangeListeners.delete(fn);
  }),
  isOutlineEnabled: (instanceId: string) =>
    !mockOutlineDisabledNodes.has(instanceId),
};
(useBuilderDataManager as jest.Mock).mockReturnValue(mockManager);

function TestComponent(props: {
  brick: string;
  instanceId: string;
}): React.ReactElement {
  const data = useOutlineEnabled(props.instanceId, props.brick !== "easy-view");
  return <div>{data ? "enabled" : "disabled"}</div>;
}

describe("useOutlineEnabled", () => {
  beforeEach(() => {
    mockOutlineDisabledNodes.clear();
  });

  it("should work for applicable bricks", () => {
    const wrapper = mount(
      <TestComponent brick="easy-view" instanceId="instance-a" />
    );
    expect(wrapper.text()).toBe("enabled");

    mockOutlineDisabledNodes.add("instance-a");
    act(() => {
      onOutlineEnabledNodesChangeListeners.forEach((fn) => fn());
    });

    expect(wrapper.text()).toBe("disabled");

    // It should remove the registered listener when component unmounted.
    wrapper.unmount();
    expect(onOutlineEnabledNodesChangeListeners.size).toBe(0);
  });

  it("should work for inapplicable bricks", () => {
    const wrapper = mount(
      <TestComponent brick="general-button" instanceId="instance-a" />
    );
    expect(wrapper.text()).toBe("disabled");
    expect(onOutlineEnabledNodesChangeListeners.size).toBe(0);
    wrapper.unmount();
  });
});
