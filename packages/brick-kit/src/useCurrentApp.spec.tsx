import React from "react";
import { act } from "react-dom/test-utils";
import { mount } from "enzyme";
import { useCurrentApp } from "./useCurrentApp";
import * as runtime from "./runtime";

const getRecentApps = jest.fn();
jest.spyOn(runtime, "getRuntime").mockReturnValue({
  getRecentApps
} as any);

const spyOnAddEventListener = jest.spyOn(window, "addEventListener");
const spyOnRemoveEventListener = jest.spyOn(window, "removeEventListener");

function HookWrapper(): React.ReactElement {
  const app = useCurrentApp();
  return <div>{app ? app.id : "undefined"}</div>;
}

describe("useCurrentApp", () => {
  afterEach(() => {
    spyOnAddEventListener.mockClear();
    spyOnRemoveEventListener.mockClear();
  });

  it("should work", () => {
    getRecentApps.mockReturnValueOnce({});
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

  it("should work when mount after recent apps exists", () => {
    getRecentApps.mockReturnValueOnce({
      currentApp: { id: "good" }
    });

    const wrapper = mount(<HookWrapper />);
    expect(wrapper.find("div").text()).toBe("good");

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
