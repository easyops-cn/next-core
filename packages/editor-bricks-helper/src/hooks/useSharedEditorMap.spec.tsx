import React from "react";
import { act } from "react-dom/test-utils";
import { mount } from "enzyme";
import { useSharedEditorMap } from "./useSharedEditorMap";
import { useBuilderDataManager } from "./useBuilderDataManager";
import { SharedEditorConf } from "../interfaces";

jest.mock("./useBuilderDataManager");

let mockData: SharedEditorConf[] = [];

const onSharedEditorListChangeListeners = new Set<() => void>();
const mockManager = {
  onSharedEditorListChange: jest.fn((fn) => {
    onSharedEditorListChangeListeners.add(fn);
    return () => onSharedEditorListChangeListeners.delete(fn);
  }),
  getSharedEditorList: () => mockData,
};
(useBuilderDataManager as jest.Mock).mockReturnValue(mockManager);

function TestComponent(): React.ReactElement {
  const data = useSharedEditorMap();
  return <div>{JSON.stringify(Array.from(data.entries()))}</div>;
}

describe("useSharedEditorMap", () => {
  it("should work", () => {
    const wrapper = mount(<TestComponent />);
    expect(wrapper.text()).toMatchInlineSnapshot(`"[]"`);

    mockData = [
      {
        id: "test.brick-a",
        editor: "shared.test-brick--editor",
      },
    ];
    act(() => {
      onSharedEditorListChangeListeners.forEach((fn) => fn());
    });

    expect(wrapper.text()).toMatchInlineSnapshot(
      `"[[\\"test.brick-a\\",{\\"id\\":\\"test.brick-a\\",\\"editor\\":\\"shared.test-brick--editor\\"}]]"`
    );

    // It should remove the registered listener when component unmounted.
    wrapper.unmount();
    expect(onSharedEditorListChangeListeners.size).toBe(0);
  });
});
