import React from "react";
import { act } from "react-dom/test-utils";
import { mount } from "enzyme";
import { useLocation } from "./useLocation";
import * as history from "./history";

function HookWrapper(): React.ReactElement {
  const location = useLocation();
  return <div>{location.pathname}</div>;
}

const listeners = new Set<Function>();
const unlistenFactory = (fn: Function) => () => listeners.delete(fn);
const triggerLocationChange = (location: any): void => {
  for (const fn of listeners.values()) {
    fn(location);
  }
};

jest.spyOn(history, "getHistory").mockReturnValue({
  listen: (fn: Function) => {
    listeners.add(fn);
    return unlistenFactory(fn);
  },
  location: {
    pathname: "/"
  }
} as any);

describe("useLocation", () => {
  it("should work", () => {
    const wrapper = mount(<HookWrapper />);
    expect(wrapper.find("div").text()).toBe("/");

    act(() => {
      triggerLocationChange({
        pathname: "/next"
      });
    });
    wrapper.update();
    expect(wrapper.find("div").text()).toBe("/next");

    wrapper.unmount();
    expect(listeners.size).toBe(0);
  });
});
