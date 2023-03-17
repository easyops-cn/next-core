import {
  jest,
  describe,
  test,
  expect,
  beforeAll,
  afterAll,
} from "@jest/globals";
import type { RuntimeContext } from "./interfaces.js";
import { listenerFactory } from "./bindListeners.js";
import { getHistory } from "../history.js";
import { DataStore } from "./data/DataStore.js";
import { handleHttpError } from "../handleHttpError.js";
import { applyTheme, applyMode } from "../themeAndMode.js";

jest.mock("../history.js");
jest.mock("../handleHttpError.js");
jest.mock("../themeAndMode.js");

const consoleLog = jest.spyOn(console, "log");
const consoleInfo = jest.spyOn(console, "info");
const consoleWarn = jest.spyOn(console, "warn");
const consoleError = jest.spyOn(console, "error");
const windowOpen = jest.spyOn(window, "open");
const windowAlert = jest.spyOn(window, "alert");
const mockGetHistory = getHistory as jest.Mock;
const mockHandleHttpError = handleHttpError as jest.MockedFunction<
  typeof handleHttpError
>;
const mockApplyTheme = applyTheme as jest.MockedFunction<
  typeof handleHttpError
>;
const mockApplyMode = applyMode as jest.MockedFunction<typeof handleHttpError>;

const tplHostElement = {
  dispatchEvent: jest.fn(),
};
const ctxStore = {
  updateValue: jest.fn(),
} as any;
const stateStore = {
  updateValue: jest.fn(),
  hostBrick: {
    element: tplHostElement,
  },
} as any;
const tplStateStoreMap = new Map<string, DataStore<"STATE">>();
const tplStateStoreId = "tpl-state-0";
tplStateStoreMap.set(tplStateStoreId, stateStore);
const runtimeContext = {
  ctxStore,
  tplStateStoreId,
  tplStateStoreMap,
} as Partial<RuntimeContext> as RuntimeContext;

const event = new CustomEvent("response", { detail: "ok" });

describe("listenerFactory for history.*", () => {
  const history = {
    push: jest.fn(),
    goBack: jest.fn(),
    reload: jest.fn(),
    pushQuery: jest.fn(),
    setBlockMessage: jest.fn(),
  };

  beforeAll(() => {
    mockGetHistory.mockReturnValue(history);
    consoleInfo.mockReturnValue();
  });
  afterAll(() => {
    mockGetHistory.mockReset();
    consoleInfo.mockReset();
  });

  test("history.push", () => {
    listenerFactory(
      {
        action: "history.push",
      },
      runtimeContext
    )(event);
    expect(history.push).toBeCalledWith("ok", undefined);
  });

  test("history.goBack", () => {
    listenerFactory(
      {
        action: "history.goBack",
      },
      runtimeContext
    )(event);
    expect(history.goBack).toBeCalledWith();
  });

  test("history.block", () => {
    listenerFactory(
      {
        action: "history.block",
        args: ["<% EVENT.detail %>"],
      },
      runtimeContext
    )(event);
    expect(history.setBlockMessage).toBeCalledWith("ok");
  });

  test("history.pushQuery with options", () => {
    listenerFactory(
      {
        action: "history.pushQuery",
        args: [
          {
            status: "<% EVENT.detail %>",
          },
          { notify: false },
        ],
      },
      runtimeContext
    )(event);
    expect(history.pushQuery).toBeCalledWith(
      { status: "ok" },
      { notify: false }
    );
  });

  test("history.reload with callback", () => {
    listenerFactory(
      {
        action: "history.reload",
        args: ["<% `/${EVENT.detail}` %>"],
        callback: {
          success: {
            action: "console.info",
            args: ["success", "<% EVENT.detail.blocked %>"],
          },
          error: {
            action: "console.info",
            args: ["error", "<% EVENT.detail.blocked %>"],
          },
          finally: {
            action: "console.info",
            args: ["finally", "<% EVENT.detail.blocked %>"],
          },
        },
      },
      runtimeContext
    )(event);

    expect(history.reload).toBeCalledWith(expect.any(Function));

    (history.reload.mock.calls[0][0] as Function)(false);
    expect(consoleInfo).toBeCalledTimes(2);
    expect(consoleInfo).toHaveBeenNthCalledWith(1, "success", false);
    expect(consoleInfo).toHaveBeenNthCalledWith(2, "finally", false);

    (history.reload.mock.calls[0][0] as Function)(true);
    expect(consoleInfo).toBeCalledTimes(4);
    expect(consoleInfo).toHaveBeenNthCalledWith(3, "error", true);
    expect(consoleInfo).toHaveBeenNthCalledWith(4, "finally", true);
  });
});

describe("listenerFactory for window.*", () => {
  beforeAll(() => {
    windowOpen.mockReturnValue(null!);
  });
  afterAll(() => {
    windowOpen.mockReset();
  });

  test("window.open", () => {
    listenerFactory(
      {
        action: "window.open",
        args: ["<% `/${EVENT.detail}` %>"],
      },
      runtimeContext
    )(event);
    expect(windowOpen).toBeCalledWith("/ok", "_self", undefined);
  });

  test("window.open with args", () => {
    listenerFactory(
      {
        action: "window.open",
        args: ["<% `/${EVENT.detail}` %>", "_blank", "popup=yes"],
      },
      runtimeContext
    )(event);
    expect(windowOpen).toBeCalledWith("/ok", "_blank", "popup=yes");
  });
});

describe("listenerFactory for location.*", () => {
  const originalLocation = window.location;

  beforeAll(() => {
    delete (window as any).location;
    window.location = {
      assign: jest.fn(),
      reload: jest.fn(),
    } as any;
  });
  afterAll(() => {
    window.location = originalLocation;
  });

  test("location.assign", () => {
    listenerFactory(
      {
        action: "location.assign",
        args: ["<% `/${EVENT.detail}` %>"],
      },
      runtimeContext
    )(event);
    expect(window.location.assign).toBeCalledWith("/ok");
  });

  test("location.reload", () => {
    listenerFactory(
      {
        action: "location.reload",
      },
      runtimeContext
    )(event);
    expect(window.location.reload).toBeCalledWith();
  });
});

describe("listenerFactory for *Storage.*", () => {
  test("localStorage", () => {
    listenerFactory(
      {
        action: "localStorage.setItem",
        args: ["myStore", "<% EVENT.detail %>"],
      },
      runtimeContext
    )(event);
    expect(localStorage.getItem("myStore")).toBe('"ok"');

    listenerFactory(
      {
        action: "localStorage.removeItem",
        args: ["myStore"],
      },
      runtimeContext
    )(event);
    expect(localStorage.getItem("myStore")).toBe(null);
  });

  test("sessionStorage", () => {
    listenerFactory(
      {
        action: "sessionStorage.setItem",
        args: ["myStore", undefined],
      },
      runtimeContext
    )(event);
    expect(sessionStorage.getItem("myStore")).toBe(null);

    listenerFactory(
      {
        action: "sessionStorage.setItem",
        args: ["myStore", "<% EVENT.detail %>"],
      },
      runtimeContext
    )(event);
    expect(sessionStorage.getItem("myStore")).toBe('"ok"');

    listenerFactory(
      {
        action: "sessionStorage.removeItem",
        args: ["myStore"],
      },
      runtimeContext
    )(event);
    expect(sessionStorage.getItem("myStore")).toBe(null);
  });
});

describe("listenerFactory for message.*", () => {
  beforeAll(() => {
    windowAlert.mockReturnValue();
  });
  afterAll(() => {
    windowAlert.mockReset();
  });

  test("message.success", () => {
    listenerFactory(
      {
        action: "message.success",
        args: ["<% EVENT.detail %>"],
      },
      runtimeContext
    )(event);
    expect(window.alert).toBeCalledWith("ok");
  });
});

describe("listenerFactory for context.*", () => {
  test("context.assign", () => {
    listenerFactory(
      {
        action: "context.assign",
        args: [
          "a",
          {
            v: "<% EVENT.detail %>",
          },
        ],
      },
      runtimeContext
    )(event);
    expect(ctxStore.updateValue).toBeCalledWith(
      "a",
      { v: "ok" },
      "assign",
      undefined,
      runtimeContext
    );
  });

  test("context.load", () => {
    listenerFactory(
      {
        action: "context.load",
        args: ["a"],
        callback: { success: [] },
      },
      runtimeContext
    )(event);
    expect(ctxStore.updateValue).toBeCalledWith(
      "a",
      undefined,
      "load",
      { success: [] },
      runtimeContext
    );
  });
});

describe("listenerFactory for state.*", () => {
  test("state.update", () => {
    listenerFactory(
      {
        action: "state.update",
        args: ["a", "<% EVENT.detail %>"],
      },
      runtimeContext
    )(event);
    expect(stateStore.updateValue).toBeCalledWith(
      "a",
      "ok",
      "replace",
      undefined,
      runtimeContext
    );
  });

  test("state.refresh", () => {
    listenerFactory(
      {
        action: "state.refresh",
        args: ["a"],
        callback: { error: [] },
      },
      runtimeContext
    )(event);
    expect(stateStore.updateValue).toBeCalledWith(
      "a",
      undefined,
      "refresh",
      { error: [] },
      runtimeContext
    );
  });
});

describe("listenerFactory for tpl.*", () => {
  test("tpl.dispatchEvent", () => {
    listenerFactory(
      {
        action: "tpl.dispatchEvent",
        args: [
          "oops",
          {
            bubbles: true,
            detail: "<% EVENT.detail %>",
          },
        ],
      },
      runtimeContext
    )(event);
    const dispatchedEvent = tplHostElement.dispatchEvent.mock
      .calls[0][0] as CustomEvent<string>;
    expect(dispatchedEvent.type).toBe("oops");
    expect(dispatchedEvent.bubbles).toBe(true);
    expect(dispatchedEvent.detail).toBe("ok");
  });
});

describe("listenerFactory for theme.*", () => {
  beforeAll(() => {
    mockApplyTheme.mockReturnValue();
  });
  afterAll(() => {
    mockApplyTheme.mockReturnValue();
  });

  test("theme.setDarkTheme", () => {
    listenerFactory(
      {
        action: "theme.setDarkTheme",
      },
      runtimeContext
    )(event);
    expect(mockApplyTheme).toBeCalledWith("dark");
  });

  test("theme.setLightTheme", () => {
    listenerFactory(
      {
        action: "theme.setLightTheme",
      },
      runtimeContext
    )(event);
    expect(mockApplyTheme).toBeCalledWith("light");
  });

  test("theme.setTheme", () => {
    listenerFactory(
      {
        action: "theme.setTheme",
        args: ['<% EVENT.detail === "ok" ? "dark-v2" : "light" %>'],
      },
      runtimeContext
    )(event);
    expect(mockApplyTheme).toBeCalledWith("dark-v2");
  });
});

describe("listenerFactory for mode.*", () => {
  beforeAll(() => {
    mockApplyMode.mockReturnValue();
  });
  afterAll(() => {
    mockApplyMode.mockReturnValue();
  });

  test("mode.setDashboardMode", () => {
    listenerFactory(
      {
        action: "mode.setDashboardMode",
      },
      runtimeContext
    )(event);
    expect(mockApplyMode).toBeCalledWith("dashboard");
  });

  test("mode.setDefaultMode", () => {
    listenerFactory(
      {
        action: "mode.setDefaultMode",
      },
      runtimeContext
    )(event);
    expect(mockApplyMode).toBeCalledWith("default");
  });
});

describe("listenerFactory for handleHttpError", () => {
  beforeAll(() => {
    mockHandleHttpError.mockReturnValue();
  });
  afterAll(() => {
    mockHandleHttpError.mockReset();
  });

  test("handleHttpError", () => {
    listenerFactory(
      {
        action: "handleHttpError",
      },
      runtimeContext
    )(event);
    expect(mockHandleHttpError).toBeCalledWith("ok");
  });
});

describe("listenerFactory for event.*", () => {
  test("event.preventDefault", () => {
    const event = { preventDefault: jest.fn() } as any;
    listenerFactory(
      {
        action: "event.preventDefault",
        args: ["<% EVENT.detail %>"],
      },
      runtimeContext
    )(event);
    expect(event.preventDefault).toBeCalledWith();
  });
});

describe("listenerFactory for console.*", () => {
  beforeAll(() => {
    consoleLog.mockReturnValue();
    consoleWarn.mockReturnValue();
    consoleError.mockReturnValue();
  });
  afterAll(() => {
    consoleLog.mockReset();
    consoleWarn.mockReset();
    consoleError.mockReset();
  });

  test("console.log with EVENT.detail", () => {
    listenerFactory(
      {
        action: "console.log",
        args: ["<% EVENT.detail %>"],
      },
      runtimeContext
    )(event);
    expect(consoleLog).toBeCalledTimes(1);
    expect(consoleLog).toBeCalledWith("ok");
  });

  test("console.warn with no args", () => {
    listenerFactory(
      {
        action: "console.warn",
      },
      runtimeContext
    )(event);
    expect(consoleWarn).toBeCalledWith(event);
  });

  test("console.error with falsy if", () => {
    listenerFactory(
      {
        action: "console.error",
        if: "<% EVENT.detail !== 'ok' %>",
      },
      runtimeContext
    )(event);
    expect(consoleError).not.toBeCalled();
  });

  test("console.error with truthy if", () => {
    listenerFactory(
      {
        action: "console.error",
        if: "<% EVENT.detail === 'ok' %>",
        args: [],
      },
      runtimeContext
    )(event);
    expect(consoleError).toBeCalledWith();
  });

  test("window.open", () => {
    listenerFactory(
      {
        action: "window.open",
        args: ["<% `/${EVENT.detail}` %>"],
      },
      runtimeContext
    )(event);
    expect(windowOpen).toBeCalledWith("/ok", "_self", undefined);
  });

  test("window.open with args", () => {
    listenerFactory(
      {
        action: "window.open",
        args: ["<% `/${EVENT.detail}` %>", "_blank", "popup=yes"],
      },
      runtimeContext
    )(event);
    expect(windowOpen).toBeCalledWith("/ok", "_blank", "popup=yes");
  });
});

describe("listenerFactory for unknown action", () => {
  beforeAll(() => {
    consoleError.mockReturnValue();
  });
  afterAll(() => {
    consoleError.mockReset();
  });

  test("unknown action", () => {
    listenerFactory(
      {
        action: "oops" as "console.log",
        args: ["<% EVENT.detail %>"],
      },
      runtimeContext
    )(event);
    expect(consoleError).toBeCalledWith(
      "unknown event listener action:",
      "oops"
    );
  });
});
