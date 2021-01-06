import React from "react";
import { act } from "react-dom/test-utils";
import { mount } from "enzyme";
import { useBuilderData } from "./useBuilderData";
import { useBuilderDataManager } from "./useBuilderDataManager";
import { BuilderCanvasData } from "../interfaces";

jest.mock("./useBuilderDataManager");

let mockData: BuilderCanvasData = {
  rootId: null,
  nodes: [],
  edges: [],
};
const onDataChangeListeners = new Set<() => void>();
const mockManager = {
  onDataChange: jest.fn((fn) => {
    onDataChangeListeners.add(fn);
    return () => onDataChangeListeners.delete(fn);
  }),
  getData: () => mockData,
};
(useBuilderDataManager as jest.Mock).mockReturnValue(mockManager);

function TestComponent(): React.ReactElement {
  const data = useBuilderData();
  return <div>{JSON.stringify(data)}</div>;
}

describe("useBuilderData", () => {
  it("should work", () => {
    const wrapper = mount(<TestComponent />);
    expect(wrapper.text()).toMatchInlineSnapshot(
      `"{\\"rootId\\":null,\\"nodes\\":[],\\"edges\\":[]}"`
    );

    mockData = {
      rootId: 1,
      nodes: [],
      edges: [
        {
          parent: 1,
          child: 2,
          mountPoint: "x",
          sort: 0,
        },
      ],
    };
    act(() => {
      onDataChangeListeners.forEach((fn) => fn());
    });

    expect(wrapper.text()).toMatchInlineSnapshot(
      `"{\\"rootId\\":1,\\"nodes\\":[],\\"edges\\":[{\\"parent\\":1,\\"child\\":2,\\"mountPoint\\":\\"x\\",\\"sort\\":0}]}"`
    );

    // It should remove the registered listener when component unmounted.
    wrapper.unmount();
    expect(onDataChangeListeners.size).toBe(0);
  });
});
