import React from "react";
import { act } from "react-dom/test-utils";
import { mount } from "enzyme";
import { useCurrentApp } from "./useCurrentApp";

function HookWrapper() {
  const app = useCurrentApp();
  return <div>{app ? app.id : "undefined"}</div>;
}

const spyOnAddEventListener = jest.spyOn(window, "addEventListener");
const spyOnRemoveEventListener = jest.spyOn(window, "removeEventListener");

describe("useCurrentApp", () => {
  it("should work", () => {
    const wrapper = mount(<HookWrapper />);
    expect(wrapper.find("div").text()).toBe("undefined");

    act(() => {
      window.dispatchEvent(
        new CustomEvent("app.change", {
          detail: {
            currentApp: {
              id: "hello"
            }
          }
        })
      );
    });
    wrapper.update();
    expect(wrapper.find("div").text()).toBe("hello");

    wrapper.unmount();
    expect(spyOnRemoveEventListener).toBeCalledWith(
      ...spyOnAddEventListener.mock.calls[0]
    );
  });
});
