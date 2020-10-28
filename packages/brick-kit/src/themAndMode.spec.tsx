import React from "react";
import { mount } from "enzyme";
import {
  getTheme as _getTheme,
  setTheme as _setTheme,
  applyTheme as _applyTheme,
  getMode as _getMode,
  setMode as _setMode,
  applyMode as _applyMode,
  useCurrentTheme,
  useCurrentMode,
} from "./themeAndMode";
import { act } from "react-dom/test-utils";

describe("theme", () => {
  let getTheme: typeof _getTheme;
  let setTheme: typeof _setTheme;
  let applyTheme: typeof _applyTheme;

  beforeEach(() => {
    jest.resetModules();
    document.documentElement.dataset.theme = "light";
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const m = require("./themeAndMode");
    getTheme = m.getTheme;
    setTheme = m.setTheme;
    applyTheme = m.applyTheme;
  });

  test("should set theme", () => {
    expect(getTheme()).toEqual("light");
    expect(document.documentElement.dataset.theme).toBe("light");
    setTheme("dark");
    expect(getTheme()).toEqual("dark");
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  test("should throw error if set an invalid theme", () => {
    expect(() => {
      setTheme("oops" as any);
    }).toThrow();
  });

  test("should apply the current theme", () => {
    expect(getTheme()).toEqual("light");
    expect(document.documentElement.dataset.theme).toBe("light");
    setTheme("dark");
    applyTheme();
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  test("should apply the specified theme", () => {
    expect(getTheme()).toEqual("light");
    expect(document.documentElement.dataset.theme).toBe("light");
    applyTheme("dark");
    expect(getTheme()).toEqual("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  test("should ignore when the applied theme is unchanged", () => {
    const dispatchEvent = jest.spyOn(window, "dispatchEvent");
    expect(getTheme()).toEqual("light");
    applyTheme("light");
    expect(dispatchEvent).not.toBeCalled();
    applyTheme("dark");
    expect(dispatchEvent).toBeCalled();
  });

  test("useCurrentTheme should work", () => {
    function TestComponent(): React.ReactElement {
      const theme = useCurrentTheme();
      return <div>{theme}</div>;
    }
    const wrapper = mount(<TestComponent />);
    expect(wrapper.text()).toBe("light");
    act(() => {
      applyTheme("dark");
    });
    wrapper.update();
    expect(wrapper.text()).toBe("dark");
    wrapper.unmount();
  });
});

describe("mode", () => {
  let getMode: typeof _getMode;
  let setMode: typeof _setMode;
  let applyMode: typeof _applyMode;

  beforeEach(() => {
    jest.resetModules();
    document.documentElement.dataset.mode = "default";
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const m = require("./themeAndMode");
    getMode = m.getMode;
    setMode = m.setMode;
    applyMode = m.applyMode;
  });

  test("should set mode", () => {
    expect(getMode()).toEqual("default");
    expect(document.documentElement.dataset.mode).toBe("default");
    setMode("dashboard");
    expect(getMode()).toEqual("dashboard");
    expect(document.documentElement.dataset.mode).toBe("default");
  });

  test("should throw error if set an invalid mode", () => {
    expect(() => {
      setMode("oops" as any);
    }).toThrow();
  });

  test("should apply the current mode", () => {
    expect(getMode()).toEqual("default");
    expect(document.documentElement.dataset.mode).toBe("default");
    setMode("dashboard");
    applyMode();
    expect(document.documentElement.dataset.mode).toBe("dashboard");
  });

  test("should apply the specified mode", () => {
    expect(getMode()).toEqual("default");
    expect(document.documentElement.dataset.mode).toBe("default");
    applyMode("dashboard");
    expect(getMode()).toEqual("dashboard");
    expect(document.documentElement.dataset.mode).toBe("dashboard");
  });

  test("should ignore when the applied mode is unchanged", () => {
    const dispatchEvent = jest.spyOn(window, "dispatchEvent");
    expect(getMode()).toEqual("default");
    applyMode("default");
    expect(dispatchEvent).not.toBeCalled();
    applyMode("dashboard");
    expect(dispatchEvent).toBeCalled();
  });

  test("useCurrentMode should work", () => {
    function TestComponent(): React.ReactElement {
      const mode = useCurrentMode();
      return <div>{mode}</div>;
    }
    const wrapper = mount(<TestComponent />);
    expect(wrapper.text()).toBe("default");
    act(() => {
      applyMode("dashboard");
    });
    wrapper.update();
    expect(wrapper.text()).toBe("dashboard");
    wrapper.unmount();
  });
});
