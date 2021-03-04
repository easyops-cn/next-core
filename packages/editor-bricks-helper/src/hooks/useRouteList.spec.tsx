import React from "react";
import { act } from "react-dom/test-utils";
import { mount } from "enzyme";
import { useRouteList } from "./useRouteList";
import { useBuilderDataManager } from "./useBuilderDataManager";
import { BuilderRouteNode } from "@next-core/brick-types";

jest.mock("./useBuilderDataManager");

let mockData: BuilderRouteNode[] = [
  {
    type: "routes",
    path: "/homepage",
    id: "R-01",
  },
];

const onRouteListChangeListeners = new Set<() => void>();
const mockManager = {
  onRouteListChange: jest.fn((fn) => {
    onRouteListChangeListeners.add(fn);
    return () => onRouteListChangeListeners.delete(fn);
  }),
  getRouteList: () => mockData,
};
(useBuilderDataManager as jest.Mock).mockReturnValue(mockManager);

function TestComponent(): React.ReactElement {
  const data = useRouteList();
  return <div>{JSON.stringify(data)}</div>;
}

describe("useRouteList", () => {
  it("should work", () => {
    const wrapper = mount(<TestComponent />);
    expect(wrapper.text()).toMatchInlineSnapshot(
      `"[{\\"type\\":\\"routes\\",\\"path\\":\\"/homepage\\",\\"id\\":\\"R-01\\"}]"`
    );

    mockData = [
      {
        type: "routes",
        path: "/homepage",
        id: "R-01",
      },
      {
        type: "bricks",
        path: "/homepage/b",
        id: "R-02",
      },
    ];
    act(() => {
      onRouteListChangeListeners.forEach((fn) => fn());
    });

    expect(wrapper.text()).toMatchInlineSnapshot(
      `"[{\\"type\\":\\"routes\\",\\"path\\":\\"/homepage\\",\\"id\\":\\"R-01\\"},{\\"type\\":\\"bricks\\",\\"path\\":\\"/homepage/b\\",\\"id\\":\\"R-02\\"}]"`
    );

    // It should remove the registered listener when component unmounted.
    wrapper.unmount();
    expect(onRouteListChangeListeners.size).toBe(0);
  });
});
