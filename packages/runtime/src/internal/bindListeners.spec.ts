import {
  jest,
  describe,
  test,
  expect,
  beforeAll,
  afterAll,
} from "@jest/globals";
import { createProviderClass } from "@next-core/utils/general";
import type { RuntimeContext } from "./interfaces.js";
import { bindListeners, listenerFactory } from "./bindListeners.js";
import { getHistory } from "../history.js";
import { DataStore } from "./data/DataStore.js";
import { handleHttpError } from "../handleHttpError.js";
import { applyTheme, applyMode } from "../themeAndMode.js";
import { startPoll } from "./poll.js";
import { hooks } from "./Runtime.js";
import { startSSEStream } from "./sse.js";

const FLOW_API_PROVIDER = "flow-api-provider";

jest.mock("../history.js");
jest.mock("../handleHttpError.js");
jest.mock("../themeAndMode.js");
jest.mock("./poll.js");
jest.mock("./sse.js");
jest.mock("./Runtime.js", () => ({
  hooks: {
    messageDispatcher: {
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
    },
    flowApi: {
      FLOW_API_PROVIDER,
      isFlowApiProvider(provider: string) {
        return provider.includes("@");
      },
      getArgsOfFlowApi(_provider: string, conf: any) {
        return [conf?.params?.input];
      },
    },
  },
}));

customElements.define(
  "flow-api-provider",
  class extends HTMLElement {
    resolve(input: string) {
      return `Flow received: ${input}`;
    }
  }
);

const consoleLog = jest.spyOn(console, "log");
const consoleInfo = jest.spyOn(console, "info");
const consoleWarn = jest.spyOn(console, "warn");
const consoleError = jest.spyOn(console, "error");
const windowOpen = jest.spyOn(window, "open");
const windowAlert = jest.spyOn(window, "alert");
const windowPostMessage = jest.spyOn(window as any, "postMessage");
const mockGetHistory = getHistory as jest.Mock;
const mockHandleHttpError = handleHttpError as jest.MockedFunction<
  typeof handleHttpError
>;
const mockApplyTheme = applyTheme as jest.MockedFunction<
  typeof handleHttpError
>;
const mockApplyMode = applyMode as jest.MockedFunction<typeof handleHttpError>;

const subscribe = hooks?.messageDispatcher?.subscribe as jest.Mock<any>;
const unsubscribe = hooks?.messageDispatcher?.unsubscribe as jest.Mock<any>;

const myTimeoutProvider = jest.fn(
  (timeout: number, result: string) =>
    new Promise((resolve) => {
      setTimeout(() => resolve(result), timeout);
    })
);
const MyTimeoutProvider = createProviderClass(myTimeoutProvider);
const saveAs = jest.fn(() => Promise.resolve("saved"));
Object.defineProperty(MyTimeoutProvider.prototype, "saveAs", {
  value: saveAs,
});
customElements.define("my-timeout-provider", MyTimeoutProvider);

let runtimeContext = {} as RuntimeContext;

const event = new CustomEvent("response", { detail: "ok" });

describe("bindListeners", () => {
  test("basic", () => {
    consoleInfo.mockReturnValueOnce();
    const element = document.createElement("div");
    bindListeners(
      element,
      {
        click: {
          action: "console.info",
          args: [],
        },
      },
      runtimeContext
    );
    element.click();
    expect(consoleInfo).toHaveBeenCalledTimes(1);
    expect(consoleInfo).toHaveBeenCalledWith();
  });

  test("empty events", () => {
    const element = document.createElement("div");
    bindListeners(element, undefined, runtimeContext);
    element.click();
    expect(consoleInfo).not.toHaveBeenCalled();
  });
});

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
    expect(history.push).toHaveBeenCalledWith("ok", undefined);
  });

  test("history.goBack", () => {
    listenerFactory(
      {
        action: "history.goBack",
      },
      runtimeContext
    )(event);
    expect(history.goBack).toHaveBeenCalledWith();
  });

  test("history.block", () => {
    listenerFactory(
      {
        action: "history.block",
        args: ["<% EVENT.detail %>"],
      },
      runtimeContext
    )(event);
    expect(history.setBlockMessage).toHaveBeenCalledWith("ok");
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
    expect(history.pushQuery).toHaveBeenCalledWith(
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

    expect(history.reload).toHaveBeenCalledWith(expect.any(Function));

    (history.reload.mock.calls[0][0] as Function)(false);
    expect(consoleInfo).toHaveBeenCalledTimes(2);
    expect(consoleInfo).toHaveBeenNthCalledWith(1, "success", false);
    expect(consoleInfo).toHaveBeenNthCalledWith(2, "finally", false);

    (history.reload.mock.calls[0][0] as Function)(true);
    expect(consoleInfo).toHaveBeenCalledTimes(4);
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
    expect(windowOpen).toHaveBeenCalledWith("/ok", "_self", undefined);
  });

  test("window.open with args", () => {
    listenerFactory(
      {
        action: "window.open",
        args: ["<% `/${EVENT.detail}` %>", "_blank", "popup=yes"],
      },
      runtimeContext
    )(event);
    expect(windowOpen).toHaveBeenCalledWith("/ok", "_blank", "popup=yes");
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
    (window as any).location = originalLocation;
  });

  test("location.assign", () => {
    listenerFactory(
      {
        action: "location.assign",
        args: ["<% `/${EVENT.detail}` %>"],
      },
      runtimeContext
    )(event);
    expect(window.location.assign).toHaveBeenCalledWith("/ok");
  });

  test("location.reload", () => {
    listenerFactory(
      {
        action: "location.reload",
      },
      runtimeContext
    )(event);
    expect(window.location.reload).toHaveBeenCalledWith();
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
    expect(window.alert).toHaveBeenCalledWith("ok");
  });
});

describe("listenerFactory for context.*", () => {
  let ctxStore: DataStore<"CTX">;

  beforeEach(async () => {
    ctxStore = new DataStore("CTX");
    runtimeContext = {
      ctxStore,
    } as RuntimeContext;
    ctxStore.define(
      [
        {
          name: "complexContext",
          value: {
            quality: "good",
          },
        },
        {
          name: "lazyContext",
          resolve: {
            useProvider: "my-timeout-provider",
            args: [30, "resolved"],
            lazy: true,
          },
          value: "initial lazy",
        },
      ],
      runtimeContext
    );
    await ctxStore.waitForAll();
  });

  test("context.assign", () => {
    listenerFactory(
      {
        action: "context.assign",
        args: [
          "complexContext",
          {
            update: "<% EVENT.detail %>",
          },
        ],
      },
      runtimeContext
    )(event);
    expect(ctxStore.getValue("complexContext")).toEqual({
      quality: "good",
      update: "ok",
    });
  });

  test("context.load", async () => {
    expect(ctxStore.getValue("lazyContext")).toEqual("initial lazy");
    listenerFactory(
      {
        action: "context.load",
        args: ["lazyContext"],
        callback: { success: [] },
      },
      runtimeContext
    )(event);
    await (global as any).flushPromises();
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(ctxStore.getValue("lazyContext")).toEqual("resolved");
  });

  test("batchUpdate context.replace", async () => {
    listenerFactory(
      {
        action: "context.replace",
        args: [
          {
            name: "complexContext",
            value: "good",
          },
        ],
      },
      runtimeContext
    )(event);
    expect(ctxStore.getValue("complexContext")).toEqual("good");
  });

  test("batchUpdate context.replace when batch was false", async () => {
    listenerFactory(
      {
        action: "context.replace",
        batch: false,
        args: [
          {
            name: "complexContext",
            value: "good",
          },
        ],
      },
      runtimeContext
    )(event);
    expect(ctxStore.getValue("complexContext")).toEqual("good");
  });
});

describe("listenerFactory for state.* and tpl.*", () => {
  let stateStore: DataStore<"STATE">;
  const tplHostElement = {
    dispatchEvent: jest.fn(),
  };

  beforeEach(async () => {
    const tplStateStoreMap = new Map<string, DataStore<"STATE">>();
    const tplStateStoreId = "tpl-state-0";
    runtimeContext = {
      tplStateStoreId,
      tplStateStoreMap,
    } as RuntimeContext;
    stateStore = new DataStore("STATE", { element: tplHostElement } as any);
    tplStateStoreMap.set(tplStateStoreId, stateStore);
    stateStore.define(
      [
        {
          name: "primitiveState",
          value: "initial primitive",
        },
        {
          name: "asyncState",
          resolve: {
            useProvider: "my-timeout-provider",
            args: [30, "<% `resolved:${STATE.primitiveState}` %>"],
          },
        },
      ],
      runtimeContext
    );
    await stateStore.waitForAll();
  });

  test("state.update and then refresh", async () => {
    expect(stateStore.getValue("primitiveState")).toBe("initial primitive");
    expect(stateStore.getValue("asyncState")).toBe(
      "resolved:initial primitive"
    );
    listenerFactory(
      {
        action: "state.update",
        args: ["primitiveState", "<% EVENT.detail %>"],
      },
      runtimeContext
    )(event);
    expect(stateStore.getValue("primitiveState")).toBe("ok");

    listenerFactory(
      {
        action: "state.refresh",
        args: ["asyncState"],
        callback: { error: [] },
      },
      runtimeContext
    )(event);
    await (global as any).flushPromises();
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(stateStore.getValue("asyncState")).toBe("resolved:ok");
  });

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

describe("listenerFactory for formstate.update", () => {
  let formStore: DataStore<"FORM_STATE">;

  beforeEach(async () => {
    const formStateStoreMap = new Map<string, DataStore<"FORM_STATE">>();
    const formStateStoreId = "form-state-0";
    runtimeContext = {
      formStateStoreId,
      formStateStoreMap,
    } as RuntimeContext;
    formStore = new DataStore("FORM_STATE");
    formStateStoreMap.set(formStateStoreId, formStore);
    formStore.define(
      [
        {
          name: "primitiveState",
          value: "initial primitive",
        },
        {
          name: "asyncState",
          resolve: {
            useProvider: "my-timeout-provider",
            args: [30, "<% `resolved:${FORM_STATE.primitiveState}` %>"],
          },
        },
      ],
      runtimeContext
    );
    await formStore.waitForAll();
  });

  test("formstate.update", async () => {
    expect(formStore.getValue("primitiveState")).toBe("initial primitive");
    expect(formStore.getValue("asyncState")).toBe("resolved:initial primitive");

    listenerFactory(
      {
        action: "formstate.update",
        args: ["primitiveState", "<% EVENT.detail %>"],
      },
      runtimeContext
    )(event);
    expect(formStore.getValue("primitiveState")).toBe("ok");
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
    expect(mockApplyTheme).toHaveBeenCalledWith("dark");
  });

  test("theme.setLightTheme", () => {
    listenerFactory(
      {
        action: "theme.setLightTheme",
      },
      runtimeContext
    )(event);
    expect(mockApplyTheme).toHaveBeenCalledWith("light");
  });

  test("theme.setTheme", () => {
    listenerFactory(
      {
        action: "theme.setTheme",
        args: ['<% EVENT.detail === "ok" ? "dark-v2" : "light" %>'],
      },
      runtimeContext
    )(event);
    expect(mockApplyTheme).toHaveBeenCalledWith("dark-v2");
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
    expect(mockApplyMode).toHaveBeenCalledWith("dashboard");
  });

  test("mode.setDefaultMode", () => {
    listenerFactory(
      {
        action: "mode.setDefaultMode",
      },
      runtimeContext
    )(event);
    expect(mockApplyMode).toHaveBeenCalledWith("default");
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
    expect(mockHandleHttpError).toHaveBeenCalledWith("ok");
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
    expect(event.preventDefault).toHaveBeenCalledWith();
  });

  test("event.stopPropagation", () => {
    const event = { stopPropagation: jest.fn() } as any;
    listenerFactory(
      {
        action: "event.stopPropagation",
        args: ["<% EVENT.detail %>"],
      },
      runtimeContext
    )(event);
    expect(event.stopPropagation).toHaveBeenCalledWith();
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
    expect(consoleLog).toHaveBeenCalledTimes(1);
    expect(consoleLog).toHaveBeenCalledWith("ok");
  });

  test("console.warn with no args", () => {
    listenerFactory(
      {
        action: "console.warn",
      },
      runtimeContext
    )(event);
    expect(consoleWarn).toHaveBeenCalledWith(event);
  });

  test("console.error with falsy if", () => {
    listenerFactory(
      {
        action: "console.error",
        if: "<% EVENT.detail !== 'ok' %>",
      },
      runtimeContext
    )(event);
    expect(consoleError).not.toHaveBeenCalled();
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
    expect(consoleError).toHaveBeenCalledWith();
  });

  test("window.open", () => {
    listenerFactory(
      {
        action: "window.open",
        args: ["<% `/${EVENT.detail}` %>"],
      },
      runtimeContext
    )(event);
    expect(windowOpen).toHaveBeenCalledWith("/ok", "_self", undefined);
  });

  test("window.open with args", () => {
    listenerFactory(
      {
        action: "window.open",
        args: ["<% `/${EVENT.detail}` %>", "_blank", "popup=yes"],
      },
      runtimeContext
    )(event);
    expect(windowOpen).toHaveBeenCalledWith("/ok", "_blank", "popup=yes");
  });

  test("window.postMessage without origin", () => {
    listenerFactory(
      {
        action: "window.postMessage",
        args: ["<% { channel: 'test-1', detail: EVENT.detail } %>"],
      },
      runtimeContext
    )(event);
    expect(windowPostMessage).toHaveBeenCalledWith(
      { channel: "test-1", detail: "ok" },
      "http://localhost"
    );
  });

  test("window.postMessage with origin", () => {
    listenerFactory(
      {
        action: "window.postMessage",
        args: [
          "<% { channel: 'test-2', detail: EVENT.detail } %>",
          "<% location.origin %>",
        ],
      },
      runtimeContext
    )(event);
    expect(windowPostMessage).toHaveBeenCalledWith(
      { channel: "test-2", detail: "ok" },
      "http://localhost"
    );
  });

  test("parent.postMessage", () => {
    const parentPostMessage = jest.fn();
    delete (window as any).parent;
    window.parent = {
      postMessage: parentPostMessage,
    } as any;
    listenerFactory(
      {
        action: "parent.postMessage",
        args: ["<% { channel: 'test-2', detail: EVENT.detail } %>"],
      },
      runtimeContext
    )(event);
    expect(parentPostMessage).toHaveBeenCalledWith({
      channel: "test-2",
      detail: "ok",
    });
    window.parent = window;
  });

  test("parent.postMessage but parent is the window itself", () => {
    expect(() =>
      listenerFactory(
        {
          action: "parent.postMessage",
          args: ["<% { channel: 'test-2', detail: EVENT.detail } %>"],
        },
        runtimeContext
      )(event)
    ).toThrowErrorMatchingInlineSnapshot(`"parent is the window itself"`);
  });
});

describe("listenerFactory for setting brick properties", () => {
  test("target _self", () => {
    const brick = {
      element: document.createElement("div"),
    };
    listenerFactory(
      {
        target: "_self",
        properties: {
          title: "<% EVENT.detail %>",
        },
      },
      runtimeContext,
      brick
    )(event);
    expect(brick.element.title).toBe("ok");
  });

  test("arbitrary target", () => {
    const element1 = document.createElement("div");
    const element2 = document.createElement("div");
    element1.classList.add("my-target");
    element2.classList.add("my-target");
    document.body.append(element1);
    document.body.append(element2);
    listenerFactory(
      {
        target: ".my-target",
        properties: {
          title: "<% EVENT.detail %>",
        },
      },
      runtimeContext
    )(event);
    expect(element1.title).toBe("ok");
    expect(element2.title).toBe("");
    element1.remove();
    element2.remove();
  });

  test("evaluable target", () => {
    const element1 = document.createElement("div");
    const element2 = document.createElement("div");
    element1.classList.add("target-error");
    element2.classList.add("target-ok");
    document.body.append(element1);
    document.body.append(element2);
    listenerFactory(
      {
        target: "<% EVENT.detail === 'ok' ? '.target-ok' : '.target-error' %>",
        properties: {
          title: "<% EVENT.detail %>",
        },
      },
      runtimeContext
    )(event);
    expect(element1.title).toBe("");
    expect(element2.title).toBe("ok");
    element1.remove();
    element2.remove();
  });

  test("pre-evaluated target", () => {
    const element1 = document.createElement("div");
    const element2 = document.createElement("div");
    element1.classList.add("target-error");
    element2.classList.add("target-ok");
    document.body.append(element1);
    document.body.append(element2);
    listenerFactory(
      {
        target: {
          [Symbol.for("pre.evaluated.raw")]:
            "<% EVENT.detail === 'ok' ? '.target-ok' : '.target-error' %>",
        },
        properties: {
          title: "<% EVENT.detail %>",
        },
      },
      runtimeContext
    )(event);
    expect(element1.title).toBe("");
    expect(element2.title).toBe("ok");
    element1.remove();
    element2.remove();
  });

  test("arbitrary multiple targets", () => {
    const element1 = document.createElement("div");
    const element2 = document.createElement("div");
    element1.classList.add("my-target");
    element2.classList.add("my-target");
    document.body.append(element1);
    document.body.append(element2);
    listenerFactory(
      {
        target: ".my-target",
        multiple: true,
        properties: {
          title: "<% EVENT.detail %>",
        },
      },
      runtimeContext
    )(event);
    expect(element1.title).toBe("ok");
    expect(element2.title).toBe("ok");
    element1.remove();
    element2.remove();
  });

  test("targetRef", () => {
    const tplStateStoreId = "tpl-state-1";
    const tplStateStoreMap = new Map<string, DataStore<"STATE">>();
    const element1 = document.createElement("div");
    const host = {
      $$getElementByRef(ref: string) {
        if (ref === "a") {
          return element1;
        }
      },
    };
    const stateStore = new DataStore("STATE", {
      type: "div",
      element: host as any,
      runtimeContext,
    });
    tplStateStoreMap.set(tplStateStoreId, stateStore);
    listenerFactory(
      {
        targetRef: "a",
        properties: {
          title: "<% EVENT.detail %>",
        },
      },
      {
        ...runtimeContext,
        tplStateStoreId,
        tplStateStoreMap,
      }
    )(event);
    expect(element1.title).toBe("ok");
  });

  test("pre-evaluated targetRef", () => {
    const tplStateStoreId = "tpl-state-1";
    const tplStateStoreMap = new Map<string, DataStore<"STATE">>();
    const element1 = document.createElement("div");
    const host = {
      $$getElementByRef(ref: string) {
        if (ref === "a") {
          return element1;
        }
      },
    };
    const stateStore = new DataStore("STATE", {
      type: "div",
      element: host as any,
      runtimeContext,
    });
    tplStateStoreMap.set(tplStateStoreId, stateStore);
    listenerFactory(
      {
        targetRef: {
          [Symbol.for("pre.evaluated.raw")]:
            "<% EVENT.detail === 'ok' ? 'a' : 'b' %>",
        } as unknown as string,
        properties: {
          title: "<% EVENT.detail %>",
        },
      },
      {
        ...runtimeContext,
        tplStateStoreId,
        tplStateStoreMap,
      }
    )(event);
    expect(element1.title).toBe("ok");
  });
});

describe("listenerFactory for calling brick methods", () => {
  test("Implicit args", () => {
    const brick = {
      element: {
        callMe: jest.fn(),
      },
    };
    listenerFactory(
      {
        target: "_self",
        method: "callMe",
      },
      runtimeContext,
      brick as any
    )(event);
    expect(brick.element.callMe).toHaveBeenCalledWith(event);
  });

  test("Callback error", async () => {
    const error = new Error("oops");
    const brick = {
      element: {
        callMe: jest.fn((_input: string) => Promise.reject(error)),
        callbackSuccess: jest.fn(),
        callbackError: jest.fn(),
        callbackFinally: jest.fn(),
      },
    };
    listenerFactory(
      {
        target: "_self",
        method: "callMe",
        args: ["<% EVENT.detail %>"],
        callback: {
          success: {
            target: "_self",
            method: "callbackSuccess",
            args: ["<% EVENT.detail %>"],
          },
          error: {
            target: "_self",
            method: "callbackError",
            args: ["<% EVENT.detail %>"],
          },
          finally: {
            target: "_self",
            method: "callbackFinally",
            args: ["<% EVENT.detail %>"],
          },
        },
      },
      runtimeContext,
      brick as any
    )(event);
    expect(brick.element.callMe).toHaveBeenCalledWith("ok");
    expect(brick.element.callbackSuccess).not.toHaveBeenCalled();
    expect(brick.element.callbackError).not.toHaveBeenCalled();
    expect(brick.element.callbackFinally).not.toHaveBeenCalled();

    await (global as any).flushPromises();
    expect(brick.element.callbackSuccess).not.toHaveBeenCalled();
    expect(brick.element.callbackError).toHaveBeenCalledWith(error);
    expect(brick.element.callbackFinally).toHaveBeenCalledWith(null);
  });

  test("Calling undefined method", async () => {
    consoleInfo.mockReturnValueOnce();
    const brick = {
      element: document.createElement("div"),
    };
    listenerFactory(
      {
        target: "_self",
        method: "callMe",
        callback: {
          error: {
            action: "console.info",
            args: ["<% EVENT.detail %>"],
          },
        },
      },
      runtimeContext,
      brick
    )(event);

    await (global as any).flushPromises();

    expect(consoleInfo).toHaveBeenCalledTimes(1);
    expect(consoleInfo).toHaveBeenCalledWith(
      new Error("target <div> has no method: callMe")
    );
  });
});

describe("listenerFactory for useProvider", () => {
  test("useProvider with callback", async () => {
    const brick = {
      element: {
        callbackSuccess: jest.fn(),
        callbackError: jest.fn(),
        callbackFinally: jest.fn(),
      },
    };
    listenerFactory(
      {
        useProvider: "my-timeout-provider",
        method: "willBeReplacedByResolve" as "resolve",
        args: [100, "resolved"],
        callback: {
          success: {
            target: "_self",
            method: "callbackSuccess",
            args: ["<% EVENT.detail %>"],
          },
          error: {
            target: "_self",
            method: "callbackError",
            args: ["<% EVENT.detail %>"],
          },
          finally: {
            target: "_self",
            method: "callbackFinally",
            args: ["<% EVENT.detail %>"],
          },
        },
      },
      runtimeContext,
      brick as any
    )(event);

    expect(brick.element.callbackSuccess).not.toHaveBeenCalled();
    expect(brick.element.callbackError).not.toHaveBeenCalled();
    expect(brick.element.callbackFinally).not.toHaveBeenCalled();

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(myTimeoutProvider).toHaveBeenCalledTimes(1);
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(brick.element.callbackSuccess).toHaveBeenCalledWith("resolved");
    expect(brick.element.callbackError).not.toHaveBeenCalled();
    expect(brick.element.callbackFinally).toHaveBeenCalledWith(null);
  });

  test("useProvider with saveAs", async () => {
    const brick = {
      element: {
        callbackSuccess: jest.fn(),
        callbackError: jest.fn(),
        callbackFinally: jest.fn(),
      },
    };
    listenerFactory(
      {
        useProvider: "my-timeout-provider",
        method: "saveAs",
        args: [100, "resolved"],
        callback: {
          success: {
            target: "_self",
            method: "callbackSuccess",
            args: ["<% EVENT.detail %>"],
          },
          error: {
            target: "_self",
            method: "callbackError",
            args: ["<% EVENT.detail %>"],
          },
          finally: {
            target: "_self",
            method: "callbackFinally",
            args: ["<% EVENT.detail %>"],
          },
        },
      },
      runtimeContext,
      brick as any
    )(event);

    expect(brick.element.callbackSuccess).not.toHaveBeenCalled();
    expect(brick.element.callbackError).not.toHaveBeenCalled();
    expect(brick.element.callbackFinally).not.toHaveBeenCalled();

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(myTimeoutProvider).not.toHaveBeenCalled();
    expect(saveAs).toHaveBeenCalledTimes(1);
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(brick.element.callbackSuccess).toHaveBeenCalledWith("saved");
    expect(brick.element.callbackError).not.toHaveBeenCalled();
    expect(brick.element.callbackFinally).toHaveBeenCalledWith(null);
  });

  test("useProvider with poll", async () => {
    listenerFactory(
      {
        useProvider: "my-timeout-provider",
        args: [100, "resolved"],
        poll: {
          enabled: "<% EVENT.detail === 'ok' %>" as unknown as boolean,
        },
        callback: {},
      },
      runtimeContext
    )(event);

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(startPoll).toHaveBeenCalledTimes(1);
    expect(myTimeoutProvider).toHaveBeenCalledTimes(0);
  });

  test("useProvider with poll not enabled", async () => {
    listenerFactory(
      {
        useProvider: "my-timeout-provider",
        args: [100, "resolved"],
        poll: {
          enabled: "<% EVENT.detail !== 'ok' %>" as unknown as boolean,
        },
        callback: {},
      },
      runtimeContext
    )(event);

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(startPoll).not.toHaveBeenCalled();
    expect(myTimeoutProvider).toHaveBeenCalledTimes(1);
  });

  test("useProvider with sse stream", async () => {
    listenerFactory(
      {
        useProvider: "my-timeout-provider",
        args: [100, "resolved"],
        sse: {
          stream: "<% EVENT.detail === 'ok' %>" as unknown as boolean,
        },
        callback: {},
      },
      runtimeContext
    )(event);

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(startSSEStream).toHaveBeenCalledTimes(1);
    expect(myTimeoutProvider).toHaveBeenCalledTimes(0);
  });

  test("useProvider with sse no stream", async () => {
    listenerFactory(
      {
        useProvider: "my-timeout-provider",
        args: [100, "resolved"],
        sse: {
          stream: "<% EVENT.detail !== 'ok' %>" as unknown as boolean,
        },
        callback: {},
      },
      runtimeContext
    )(event);

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(startSSEStream).not.toHaveBeenCalled();
    expect(myTimeoutProvider).toHaveBeenCalledTimes(1);
  });

  test("useProvider with flow api", async () => {
    consoleInfo.mockReturnValueOnce();
    listenerFactory(
      {
        useProvider: "flow@api:1.0",
        params: {
          input: "<% EVENT.detail %>",
        },
        callback: {
          success: {
            action: "console.info",
            args: ["<% EVENT.detail %>"],
          },
        },
      },
      runtimeContext
    )(event);

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(consoleInfo).toHaveBeenCalledWith("Flow received: ok");
  });
});

describe("listenerFactory for unknown handlers", () => {
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
    expect(consoleError).toHaveBeenCalledWith(
      "unknown event listener action:",
      "oops"
    );
  });

  test("unknown handler", () => {
    listenerFactory(
      {
        provider: "oops",
      } as any,
      runtimeContext
    )(event);
    expect(consoleError).toHaveBeenCalledWith("unknown event handler:", {
      provider: "oops",
    });
  });
});

describe("if/else condition", () => {
  let ctxStore: DataStore<"CTX">;

  beforeEach(async () => {
    consoleLog.mockReturnValue();

    ctxStore = new DataStore("CTX");
    runtimeContext = {
      ctxStore,
    } as RuntimeContext;
    ctxStore.define(
      [
        {
          name: "yes",
          value: true,
        },
        {
          name: "no",
          value: false,
        },
      ],
      runtimeContext
    );
    await ctxStore.waitForAll();
  });

  afterEach(() => {
    consoleLog.mockReset();
  });

  it("basic", async () => {
    listenerFactory(
      {
        if: true,
        then: [
          {
            useProvider: "my-timeout-provider",
            args: [10, "resolved"],
            callback: {
              success: [
                {
                  if: "<% CTX.yes %>",
                  then: [
                    {
                      action: "console.log",
                      args: ["进入 then 逻辑", "<% EVENT.detail %>"],
                    },
                    {
                      useProvider: "my-timeout-provider",
                      args: [10, "nest-provider"],
                      callback: {
                        success: [
                          {
                            if: "<% CTX.yes %>",
                            then: {
                              action: "console.log",
                              args: [
                                "进入嵌套 provider 逻辑",
                                "<% EVENT.detail %>",
                              ],
                            },
                          },
                        ],
                      },
                    },
                    {
                      if: true,
                      then: {
                        action: "console.log",
                        args: ["进入嵌套 then 逻辑"],
                      },
                    },
                  ],
                },
                {
                  if: "<% CTX.no %>",
                  then: [],
                  else: [
                    {
                      action: "console.log",
                      args: ["进入 else 逻辑"],
                    },
                    {
                      if: "<% CTX.no %>",
                      then: [],
                      else: {
                        action: "console.log",
                        args: ["进入嵌套 else 逻辑"],
                      },
                    },
                  ],
                },
                {
                  if: true,
                  then: [],
                  else: {
                    action: "console.log",
                    args: ["不执行"],
                  },
                },
                {
                  if: false,
                  then: {
                    action: "console.log",
                    args: ["不执行"],
                  },
                },
                {
                  if: false,
                  action: "console.log",
                  args: ["不执行"],
                  else: {
                    action: "console.log",
                    args: ["执行"],
                  },
                },
                {
                  if: false,
                  useProvider: "my-timeout-provider",
                  args: [10, "nest-provider"],
                  else: {
                    action: "console.log",
                    args: ["执行"],
                  },
                },
              ],
            },
          },
        ],
      },
      runtimeContext
    )(event);

    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(myTimeoutProvider).toHaveBeenCalledTimes(1);

    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(myTimeoutProvider).toHaveBeenCalledTimes(2);
    expect(consoleLog).toHaveBeenCalledTimes(6);

    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(myTimeoutProvider).toHaveBeenCalledTimes(2);
    expect(consoleLog).toHaveBeenCalledTimes(7);

    expect(consoleLog).toHaveBeenNthCalledWith(1, "进入 then 逻辑", "resolved");

    expect(consoleLog).toHaveBeenNthCalledWith(2, "进入嵌套 then 逻辑");

    expect(consoleLog).toHaveBeenNthCalledWith(3, "进入 else 逻辑");

    expect(consoleLog).toHaveBeenNthCalledWith(4, "进入嵌套 else 逻辑");

    expect(consoleLog).toHaveBeenNthCalledWith(5, "执行");

    expect(consoleLog).toHaveBeenNthCalledWith(6, "执行");

    expect(consoleLog).toHaveBeenNthCalledWith(
      7,
      "进入嵌套 provider 逻辑",
      "nest-provider"
    );
  });
});

describe("listenerFactory for message dispatcher", () => {
  beforeEach(() => {
    consoleInfo.mockReturnValue();
  });
  afterEach(() => {
    consoleInfo.mockReset();
  });

  test("message.subscribe", async () => {
    subscribe.mockResolvedValue("ok");
    listenerFactory(
      {
        action: "message.subscribe",
        args: ["my-channel"],
        callback: {
          success: {
            action: "console.info",
            args: ["sub success", "<% EVENT.detail %>"],
          },
          error: {
            action: "console.info",
            args: ["sub error", "<% EVENT.detail %>"],
          },
          finally: {
            action: "console.info",
            args: ["sub finally"],
          },
        },
      },
      runtimeContext
    )(event);
    expect(subscribe).toHaveBeenCalledWith("my-channel");
    await (global as any).flushPromises();
    expect(consoleInfo).toHaveBeenCalledWith("sub success", "ok");
    expect(consoleInfo).toHaveBeenCalledWith("sub finally");
    subscribe.mockReset();
  });

  test("message.unsubscribe", async () => {
    unsubscribe.mockRejectedValue("failed");
    listenerFactory(
      {
        action: "message.unsubscribe",
        args: ["my-channel"],
        callback: {
          success: {
            action: "console.info",
            args: ["unsub success", "<% EVENT.detail %>"],
          },
          error: {
            action: "console.info",
            args: ["unsub error", "<% EVENT.detail %>"],
          },
          finally: {
            action: "console.info",
            args: ["unsub finally"],
          },
        },
      },
      runtimeContext
    )(event);
    expect(unsubscribe).toHaveBeenCalledWith("my-channel");
    await (global as any).flushPromises();
    expect(consoleInfo).toHaveBeenCalledWith("unsub error", "failed");
    expect(consoleInfo).toHaveBeenCalledWith("unsub finally");
    unsubscribe.mockReset();
  });

  test("message.unsubscribe with no callback", async () => {
    unsubscribe.mockResolvedValue("ok");
    listenerFactory(
      {
        action: "message.unsubscribe",
        args: ["my-channel-2"],
      },
      runtimeContext
    )(event);
    expect(unsubscribe).toHaveBeenCalledWith("my-channel-2");
    unsubscribe.mockReset();
  });
});
