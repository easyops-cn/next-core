import React from "react";
import { act } from "react-dom/test-utils";
import { mount } from "enzyme";
import { useBuilderData } from "./useBuilderData";
import { setCachedCanvasData } from "../internal/cachedCanvasData";
import { BuilderEventType } from "../interfaces";

const mockAddEventListener = jest.spyOn(window, "addEventListener");
const mockRemoveEventListener = jest.spyOn(window, "removeEventListener");

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

    setCachedCanvasData({
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
    });

    act(() => {
      window.dispatchEvent(new CustomEvent(BuilderEventType.DATA_UPDATE));
    });
    expect(wrapper.text()).toMatchInlineSnapshot(
      `"{\\"rootId\\":1,\\"nodes\\":[],\\"edges\\":[{\\"parent\\":1,\\"child\\":2,\\"mountPoint\\":\\"x\\",\\"sort\\":0}]}"`
    );

    // It should remove the registered listener when component unmounted.
    wrapper.unmount();
    expect(mockRemoveEventListener).toBeCalledWith(
      ...mockAddEventListener.mock.calls[0]
    );
  });
});
