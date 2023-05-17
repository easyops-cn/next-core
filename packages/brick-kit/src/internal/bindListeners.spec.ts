/* eslint-disable no-console */
import {
  BrickEventHandler,
  BrickEventsMap,
  StoryboardContextItem,
} from "@next-core/brick-types";
import { userAnalytics } from "@next-core/easyops-analytics";
import {
  isBuiltinHandler,
  isCustomHandler,
  bindListeners,
  unbindListeners,
  listenerFactory,
} from "./bindListeners";
import { getHistory } from "../history";
import * as runtime from "../core/Runtime";
import { getMessageDispatcher } from "../core/MessageDispatcher";
import { message } from "antd";
import { CUSTOM_API_PROVIDER } from "../providers/CustomApi";
import { applyTheme, applyMode } from "../themeAndMode";
import { clearMenuTitleCache, clearMenuCache } from "./menu";
import { getRuntime } from "../runtime";
import { StoryboardContextWrapper } from "../core/StoryboardContext";
import { CustomTemplateContext } from "../core/CustomTemplates/CustomTemplateContext";
import { symbolForTplContextId } from "../core/CustomTemplates";

jest.mock("../history");
jest.mock("../core/MessageDispatcher");
jest.mock("../themeAndMode");
jest.mock("./menu");
jest.mock("../runtime");

// Mock a custom element of `any-provider`.
customElements.define(
  "any-provider",
  class Tmp extends HTMLElement {
    resolve = jest
      .fn()
      .mockResolvedValueOnce("progressing")
      .mockResolvedValueOnce("resolved");
  }
);

customElements.define(
  CUSTOM_API_PROVIDER,
  class ProviderCustomApi extends HTMLElement {
    resolve(): string {
      return "custom api resolved";
    }
  }
);

const mockHistory = {
  push: jest.fn((loc, state, callback) => {
    callback?.(true);
  }),
  replace: jest.fn((loc, state, callback) => {
    callback?.(false);
  }),
  pushQuery: jest.fn(),
  replaceQuery: jest.fn(),
  pushAnchor: jest.fn(),
  reload: jest.fn(),
  goBack: jest.fn(),
  goForward: jest.fn(),
  setBlockMessage: jest.fn(),
  unblock: jest.fn(),
  location: {
    search: "?page=3",
  },
};
(getHistory as jest.Mock).mockReturnValue(mockHistory);

const mockMessageDispatcher = {
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
} as any;

(getMessageDispatcher as jest.Mock).mockReturnValue(mockMessageDispatcher);
(getRuntime as jest.Mock).mockReturnValue({
  getCurrentApp: () => ({
    id: "micro-app-id",
  }),
  getCurrentRoute: () => ({
    alias: "route alias",
  }),
});

const mockMessageSuccess = jest.spyOn(message, "success");
const mockMessageError = jest.spyOn(message, "error");
const mockMessageInfo = jest.spyOn(message, "info");
const mockMessageWarn = jest.spyOn(message, "warn");
const storyboardContextWrapper = new StoryboardContextWrapper();
const storyboardContext = storyboardContextWrapper.get() as Map<string, any>;
jest.spyOn(runtime, "_internalApiGetCurrentContext").mockReturnValue({
  app: {
    $$routeAliasMap: new Map([
      [
        "segue-target-a",
        {
          path: "/segue-target-a",
          alias: "segue-target-a",
        },
      ],
      [
        "segue-target-b",
        {
          path: "/segue-target-b/:id",
          alias: "segue-target-b",
        },
      ],
      [
        "mock-alias-a",
        {
          path: "/mock/alias/a",
          alias: "mock-alias-a",
        },
      ],
      [
        "mock-alias-b",
        {
          path: "/mock/alias/b/:type",
          alias: "mock-alias-b",
        },
      ],
    ]),
  },
  segues: {
    testSegueIdA: {
      target: "segue-target-a",
    },
    testSegueIdB: {
      target: "segue-target-b",
    },
  },
  storyboardContext,
} as any);

jest
  .spyOn(runtime, "_internalApiGetStoryboardContextWrapper")
  .mockReturnValue(storyboardContextWrapper);

const anyProvider = document.createElement("any-provider");
const customApiProvider = document.createElement(CUSTOM_API_PROVIDER);

jest
  .spyOn(runtime, "_internalApiGetProviderBrick")
  .mockImplementation(async (provider: string): Promise<HTMLElement> => {
    await Promise.resolve();
    if (provider === "any-provider") {
      return anyProvider;
    }
    if (provider === "easyops.custom_api@myAwesomeApi") {
      return customApiProvider;
    }
    throw new Error(`Provider not defined: "${provider}".`);
  });

jest
  .spyOn(runtime, "_internalApiGetMicroAppApiOrchestrationMap")
  .mockResolvedValue(
    new Map([
      [
        "easyops.custom_api@myAwesomeApi",
        {
          contract: {
            endpoint: {
              method: "POST",
              uri: "/object/:objectId/instance/_search",
            },
            name: "myAwesomeApi",
            response: {
              fields: [
                {
                  description: "instance list",
                  name: "list",
                  type: "map[]",
                },
              ],
              type: "object",
            },
          },
          name: "myAwesomeApi",
          namespace: "easyops.custom_api",
        },
      ],
    ])
  );
const sypOnUserAnalyticsEvent = jest.spyOn(userAnalytics, "event");

userAnalytics.init({ gaMeasurementId: "GA-MEASUREMENT-ID" });

describe("isBuiltinHandler", () => {
  const cases: [BrickEventHandler, boolean][] = [
    [{ target: "", method: "" }, false],
    [{ action: "history.push" }, true],
  ];

  it.each(cases)(
    "isBuiltinHandler(%j) should return %s",
    (handler, expected) => {
      expect(isBuiltinHandler(handler)).toBe(expected);
    }
  );
});

const expectEvent = (event: CustomEvent): any =>
  expect.objectContaining({
    type: event.type,
    detail: event.detail,
  });

describe("isCustomHandler", () => {
  const cases: [BrickEventHandler, boolean][] = [
    [{ target: "", method: "" }, false],
    [{ target: "", method: "method" }, false],
    [{ target: "target", method: "" }, false],
    [{ target: "target", method: "method" }, true],
  ];

  it.each(cases)("isCustomHandler(%j) should return %s", (value, expected) => {
    expect(isCustomHandler(value)).toBe(expected);
  });
});

describe("bindListeners", () => {
  const myObjectContextEventTarget = {
    dispatchEvent: jest.fn(),
  } as unknown as EventTarget;
  beforeEach(() => {
    storyboardContext.clear();
    const ctx: [string, StoryboardContextItem][] = [
      [
        "myStringContext",
        {
          type: "free-variable",
          value: "good",
        },
      ],
      [
        "myNumberContext",
        {
          type: "free-variable",
          value: 3,
        },
      ],
      [
        "myObjectContext",
        {
          type: "free-variable",
          value: {
            quality: "better",
          },
          eventTarget: myObjectContextEventTarget,
        },
      ],
      [
        "myPropContext",
        {
          type: "brick-property",
          brick: {
            element: {
              quality: "better",
            } as any,
          },
          prop: "quality",
        },
      ],
      [
        "myLazyContext",
        {
          type: "free-variable",
          value: "initial",
          load(options) {
            return Promise.resolve(
              `[cache:${options.cache ?? "default"}] lazily updated`
            );
          },
        },
      ],
    ];
    ctx.forEach(([name, value]) => {
      storyboardContext.set(name, value);
    });
  });

  it("should work", async () => {
    const sourceElem = document.createElement("div");
    const targetElem = document.createElement("div");
    const targetElem2 = document.createElement("div");
    targetElem.id = "target-elem";
    targetElem2.id = "target-elem2";
    (sourceElem as any).forGood = jest.fn();
    (targetElem as any).forGood = jest.fn();
    (targetElem2 as any).forGood = jest.fn();
    (targetElem as any).forAsyncWillSuccess = jest
      .fn()
      .mockResolvedValue("yes");
    (targetElem2 as any).forAsyncWillError = jest
      .fn()
      .mockRejectedValue("oops");
    (targetElem2 as any).forSyncWillError = jest.fn().mockImplementation(() => {
      throw new Error("sync oops");
    });
    document.body.appendChild(sourceElem);
    document.body.appendChild(targetElem);
    document.body.appendChild(targetElem2);

    const legacyIframeMountPoint = document.createElement("div");
    legacyIframeMountPoint.id = "legacy-iframe-mount-point";
    document.body.appendChild(legacyIframeMountPoint);
    const iframeElement = document.createElement("iframe");
    legacyIframeMountPoint.appendChild(iframeElement);
    (iframeElement.contentWindow as any).angular = {};

    iframeElement.contentWindow.postMessage = jest.fn();
    window.parent.postMessage = jest.fn();
    const eventsMap: BrickEventsMap = {
      key1: [
        {
          action: "history.push",
          callback: {
            success: {
              action: "console.info",
              args: ["<% `history.push:success:${EVENT.detail.blocked}` %>"],
            },
            error: {
              action: "console.info",
              args: ["<% `history.push:error:${EVENT.detail.blocked}` %>"],
            },
            finally: {
              action: "console.info",
              args: ["<% `history.push:finally:${EVENT.detail.blocked}` %>"],
            },
          },
        },
        {
          action: "history.replace",
          args: ["specified args for history.replace"],
          callback: {
            success: {
              action: "console.info",
              args: ["<% `history.replace:success:${EVENT.detail.blocked}` %>"],
            },
            error: {
              action: "console.info",
              args: ["<% `history.replace:error:${EVENT.detail.blocked}` %>"],
            },
            finally: {
              action: "console.info",
              args: ["<% `history.replace:finally:${EVENT.detail.blocked}` %>"],
            },
          },
        },
        {
          action: "history.pushQuery",
          args: [
            {
              q: "123",
              a: undefined,
              list: ["a", "b"],
            },
            {
              extraQuery: {
                page: 1,
              },
            },
          ],
        },
        {
          action: "history.replaceQuery",
          args: [
            {
              page: 1,
            },
          ],
        },
        {
          action: "history.pushAnchor",
          args: ["yes"],
        },
        { action: "history.goBack" },
        {
          action: "history.goForward",
        },
        {
          action: "history.reload",
        },
        { action: "history.block", args: ["Are you sure to leave?"] },
        { action: "history.unblock" },
        {
          action: "legacy.go",
          args: ["www.google.com"],
        },
        {
          action: "window.open",
          args: ["www.google.com"],
        },
        {
          action: "location.reload",
          args: [true],
        },
        { action: "location.assign", args: ["www.baidu.com"] },
        {
          action: "segue.push",
          args: ["testSegueIdA"],
          callback: {
            success: {
              action: "console.info",
              args: ["<% `segue.push:success:${EVENT.detail.blocked}` %>"],
            },
            error: {
              action: "console.info",
              args: ["<% `segue.push:error:${EVENT.detail.blocked}` %>"],
            },
            finally: {
              action: "console.info",
              args: ["<% `segue.push:finally:${EVENT.detail.blocked}` %>"],
            },
          },
        },
        {
          action: "segue.replace",
          args: ["testSegueIdB", { id: "${EVENT.detail}" }],
        },
        { action: "alias.push", args: ["mock-alias-a"] },
        {
          action: "alias.replace",
          args: ["mock-alias-b", { type: "${EVENT.detail}" }],
        },
        { action: "event.preventDefault" },
        { action: "console.log" },
        { action: "console.info" },
        { action: "console.warn", args: ["specified args for console.warn"] },
        {
          action: "console.error",
          args: ["specified args for console.error"],
        },
        {
          action: "message.success",
        },
        {
          action: "message.error",
        },
        {
          action: "message.info",
        },
        {
          action: "message.warn",
        },
        {
          action: "context.replace",
          args: ["myStringContext", "not-bad"],
        },
        {
          action: "context.replace",
          batch: true,
          args: [
            {
              name: "myStringContext",
              value: "good",
            },
          ],
        },
        {
          action: "context.replace",
          batch: false,
          args: [
            {
              name: "myStringContext",
              value: "not-bad",
            },
          ],
        },
        {
          action: "context.replace",
          args: ["myStringContext", "not-bad"],
        },
        {
          action: "context.assign",
          args: [
            "myNumberContext",
            {
              number: "<% CTX.myNumberContext + 1 %>",
            },
          ],
        },
        {
          action: "context.assign",
          args: [
            "myObjectContext",
            {
              checked: true,
            },
          ],
        },
        {
          action: "context.assign",
          args: [
            "myNewContext",
            {
              hello: "world",
            },
          ],
        },
        {
          action: "context.assign",
          args: [
            "myPropContext",
            {
              something: "wrong",
            },
          ],
        },
        {
          action: "context.refresh",
          args: ["myLazyContext"],
        },
        {
          action: "message.subscribe",
          args: [
            "task1",
            {
              system: "pipeline",
              topic: "pipeline.running.001",
            },
          ],
          callback: {
            success: {
              action: "console.log",
            },
            error: {
              action: "console.log",
            },
          },
        },
        {
          action: "message.unsubscribe",
          args: [
            "task1",
            {
              system: "pipeline",
              topic: "pipeline.running.001",
            },
          ],
          callback: {
            success: {
              action: "console.log",
            },
            error: {
              action: "console.log",
            },
          },
        },
        { action: "theme.setLightTheme" },
        { action: "theme.setDarkTheme" },
        {
          action: "theme.setTheme",
          args: ["dark-v2"],
        },
        { action: "mode.setDefaultMode" },
        { action: "mode.setDashboardMode" },
        { action: "menu.clearMenuTitleCache" },
        { action: "menu.clearMenuCache" },
        {
          action: "localStorage.setItem",
          args: ["visit-history", undefined],
        },
        {
          action: "localStorage.setItem",
          args: [
            "visit-history",
            {
              id: "mockId",
            },
          ],
        },
        {
          action: "localStorage.removeItem",
          args: ["visit-history"],
        },
        {
          action: "sessionStorage.setItem",
          args: ["foo", undefined],
        },
        {
          action: "sessionStorage.setItem",
          args: [
            "foo",
            {
              name: "bar",
            },
          ],
        },
        {
          action: "sessionStorage.removeItem",
          args: ["foo"],
        },
        {
          action: "analytics.event",
          args: ["action", { param1: "<% CTX.myNewContext.hello %>" }],
        },
        { action: "preview.debug", args: ["test"] },
      ],
      key2: [
        { target: '<% "#target-elem" %>', method: "forGood" },
        { target: "_self", method: "forGood", args: ["target is _self"] },
        {
          target: "#target-elem,#target-elem2",
          multiple: true,
          method: "forGood",
          args: ["specified args for multiple"],
        },
        {
          target: "#target-elem",
          method: "forAsyncWillSuccess",
          callback: {
            success: [
              {
                action: "console.log",
              },
              {
                action: "console.log",
                args: ["<% EVENT.oops() %>"],
              },
            ],
            error: {
              action: "console.warn",
            },
          },
        },
        {
          target: "#target-elem2",
          method: "forAsyncWillError",
          callback: {
            success: {
              action: "console.log",
            },
            error: {
              action: "console.warn",
            },
            finally: {
              action: "console.info",
            },
          },
        },
        {
          target: "#target-elem2",
          method: "forSyncWillError",
          callback: {
            error: {
              action: "console.warn",
            },
          },
        },
        { target: "#target-elem", method: "notExisted" },
        { target: "#not-existed", method: "forGood" },
        {
          target: "#target-elem",
          properties: { someProperty: "${EVENT.detail}" },
        },
        { target: "<% {} %>", method: "forGood" },
        {
          useProvider: "any-provider",
          args: ["for", "${EVENT.detail}"],
          poll: {
            enabled: "${EVENT.detail}",
            expectPollEnd: '<% (result) => result === "resolved" %>',
          },
          callback: {
            progress: {
              action: "console.info",
            },
            success: {
              action: "console.log",
            },
          },
        },
        {
          useProvider: "not-defined-provider",
          callback: {
            success: {
              action: "console.log",
            },
          },
        },
        {
          useProvider: "easyops.custom_api@myAwesomeApi",
          args: ["myObjectId"],
          callback: {
            success: {
              action: "console.log",
            },
          },
        },
      ],
      key3: { action: "not.existed" },
      key4: {},
    } as any;

    const location = window.location;
    delete window.location;
    window.location = {
      origin: "http://www.google.com",
      reload: jest.fn(),
      assign: jest.fn(),
    } as unknown as Location;

    jest.spyOn(console, "log").mockImplementation(() => void 0);
    jest.spyOn(console, "info").mockImplementation(() => void 0);
    jest.spyOn(console, "warn").mockImplementation(() => void 0);
    jest.spyOn(console, "error").mockImplementation(() => void 0);
    window.open = jest.fn();

    jest.spyOn(Storage.prototype, "setItem");
    jest.spyOn(Storage.prototype, "removeItem");

    bindListeners(sourceElem, eventsMap, {} as any);

    const event1 = new CustomEvent("key1", {
      detail: "for-good",
    });
    const spyOnPreventDefault = jest.spyOn(event1, "preventDefault");
    sourceElem.dispatchEvent(event1);
    const event2 = new CustomEvent("key2", {
      detail: "for-better",
    });
    sourceElem.dispatchEvent(event2);

    expect(storyboardContext.get("myLazyContext").value).toBe("initial");

    await jest.runAllTimers();
    await (global as any).flushPromises();
    await jest.runAllTimers();
    await (global as any).flushPromises();
    await jest.runAllTimers();
    await (global as any).flushPromises();

    expect(window.parent.postMessage).toHaveBeenCalledTimes(1);
    expect(window.top.postMessage).toHaveBeenCalledWith({
      sender: "previewer",
      type: "preview.debug",
      res: ["test"],
    });
    expect(iframeElement.contentWindow.postMessage).toBeCalledWith(
      {
        type: "location.url",
        url: "www.google.com",
      },
      "http://www.google.com"
    );

    expect(localStorage.setItem).toBeCalledWith(
      "visit-history",
      '{"id":"mockId"}'
    );
    expect(localStorage.setItem).toBeCalledTimes(2);
    expect(localStorage.removeItem).toBeCalledWith("visit-history");

    expect(sessionStorage.setItem).toBeCalledWith("foo", '{"name":"bar"}');
    expect(sessionStorage.setItem).toBeCalledTimes(2);
    expect(sessionStorage.removeItem).toBeCalledWith("foo");

    const history = mockHistory;
    expect(history.push).toHaveBeenNthCalledWith(
      1,
      "for-good",
      undefined,
      expect.any(Function)
    );
    expect(history.push).toHaveBeenNthCalledWith(
      2,
      "/segue-target-a",
      undefined,
      expect.any(Function)
    );
    expect(history.push).toHaveBeenNthCalledWith(3, "/mock/alias/a");
    expect(history.pushQuery).toBeCalledWith(
      {
        q: "123",
        a: undefined,
        list: ["a", "b"],
      },
      {
        extraQuery: {
          page: 1,
        },
      }
    );
    expect(history.replace).toHaveBeenNthCalledWith(
      1,
      "specified args for history.replace",
      undefined,
      expect.any(Function)
    );
    expect(history.replace).toHaveBeenNthCalledWith(
      2,
      "/segue-target-b/for-good",
      undefined,
      undefined
    );
    expect(history.replace).toHaveBeenNthCalledWith(
      3,
      "/mock/alias/b/for-good"
    );
    expect(history.replaceQuery).toBeCalledWith(
      {
        page: 1,
      },
      undefined
    );
    expect(history.pushAnchor).toBeCalledWith("yes", undefined);
    expect(history.goBack).toBeCalledWith();
    expect(history.goForward).toBeCalledWith();
    expect(history.reload).toBeCalled();
    expect(history.setBlockMessage).toBeCalledWith("Are you sure to leave?");
    expect(history.unblock).toBeCalled();

    expect(window.location.reload).toBeCalledWith();
    expect(window.location.assign).toBeCalledWith("www.baidu.com");
    expect(sypOnUserAnalyticsEvent).toBeCalledWith("action", {
      micro_app_id: "micro-app-id",
      route_alias: "route alias",
      param1: "world",
    });

    window.location = location;

    expect(spyOnPreventDefault).toBeCalled();

    expect(
      (myObjectContextEventTarget.dispatchEvent as jest.Mock).mock.calls[0][0]
    ).toMatchObject({
      type: "context.change",
      detail: {
        checked: true,
        quality: "better",
      },
    });

    expect(console.log).toBeCalledTimes(4);
    expect(console.log).toHaveBeenNthCalledWith(1, expectEvent(event1));
    expect((console.log as jest.Mock).mock.calls[1][0].type).toBe(
      "callback.success"
    );
    expect((console.log as jest.Mock).mock.calls[1][0].detail).toBe("yes");
    expect((console.log as jest.Mock).mock.calls[2][0].type).toBe(
      "callback.success"
    );
    expect((console.log as jest.Mock).mock.calls[2][0].detail).toBe(
      "custom api resolved"
    );
    expect((console.log as jest.Mock).mock.calls[3][0].detail).toBe("resolved");

    expect(console.info).toBeCalledTimes(10);
    expect(console.info).toHaveBeenNthCalledWith(1, "history.push:error:true");
    expect(console.info).toHaveBeenNthCalledWith(
      2,
      "history.push:finally:true"
    );
    expect(console.info).toHaveBeenNthCalledWith(
      3,
      "history.replace:success:false"
    );
    expect(console.info).toHaveBeenNthCalledWith(
      4,
      "history.replace:finally:false"
    );
    expect(console.info).toHaveBeenNthCalledWith(5, "segue.push:error:true");
    expect(console.info).toHaveBeenNthCalledWith(6, "segue.push:finally:true");
    expect(console.info).toHaveBeenNthCalledWith(7, expectEvent(event1));
    expect(console.info).toHaveBeenNthCalledWith(
      8,
      expectEvent(
        new CustomEvent("callback.finally", {
          detail: undefined,
        })
      )
    );
    expect(console.info).toHaveBeenNthCalledWith(
      9,
      expectEvent(
        new CustomEvent("callback.progress", {
          detail: "progressing",
        })
      )
    );
    expect(console.info).toHaveBeenNthCalledWith(
      10,
      expectEvent(
        new CustomEvent("callback.progress", {
          detail: "resolved",
        })
      )
    );

    expect(console.warn).toBeCalledTimes(5);
    expect(console.warn).toHaveBeenNthCalledWith(
      1,
      "specified args for console.warn"
    );
    expect(console.warn).toHaveBeenNthCalledWith(
      2,
      'Non-object current value of context "myNumberContext" for "context.assign", try "context.replace" instead.'
    );
    expect(console.warn).toHaveBeenNthCalledWith(
      3,
      'Context "myNewContext" is not declared, we recommend declaring it first.'
    );
    expect(console.warn).toHaveBeenNthCalledWith(
      4,
      new CustomEvent("callback.error", {
        detail: "oops",
      })
    );
    expect(console.warn).toHaveBeenNthCalledWith(
      5,
      new CustomEvent("callback.error", {
        detail: "sync oops",
      })
    );

    expect(console.error).toBeCalledTimes(8);
    expect(console.error).toHaveBeenNthCalledWith(
      1,
      "specified args for console.error"
    );
    expect((console.error as jest.Mock).mock.calls[2][0]).toBe(
      "target has no method:"
    );
    expect((console.error as jest.Mock).mock.calls[2][1].method).toBe(
      "notExisted"
    );
    expect(console.error).toHaveBeenNthCalledWith(
      4,
      "target not found:",
      "#not-existed"
    );
    expect(console.error).toHaveBeenNthCalledWith(5, "unexpected target:", {});
    expect(console.error).toHaveBeenNthCalledWith(
      6,
      "target not found:",
      "<% {} %>"
    );
    expect(console.error).toHaveBeenNthCalledWith(
      7,
      'Error: Provider not defined: "not-defined-provider".'
    );
    expect(console.error).toHaveBeenNthCalledWith(
      8,
      expect.objectContaining({
        message: expect.stringContaining("EVENT.oops is not a function"),
      })
    );

    expect((sourceElem as any).forGood).toHaveBeenNthCalledWith(
      1,
      "target is _self"
    );
    expect((targetElem as any).forGood).toHaveBeenNthCalledWith(
      1,
      expectEvent(event2)
    );
    expect((targetElem as any).forGood).toHaveBeenNthCalledWith(
      2,
      "specified args for multiple"
    );
    expect(window.open).toBeCalledWith("www.google.com", "_self", undefined);
    expect((targetElem2 as any).forGood).toHaveBeenNthCalledWith(
      1,
      "specified args for multiple"
    );
    expect((targetElem as any).someProperty).toBe(event2.detail);

    expect(storyboardContext.get("myStringContext").value).toBe("not-bad");
    expect(storyboardContext.get("myNumberContext").value).toEqual({
      number: 4,
    });
    expect(storyboardContext.get("myObjectContext").value).toEqual({
      quality: "better",
      checked: true,
    });
    expect(storyboardContext.get("myNewContext").value).toEqual({
      hello: "world",
    });
    expect(storyboardContext.get("myLazyContext").value).toBe(
      "[cache:reload] lazily updated"
    );

    expect(mockMessageDispatcher.subscribe).toHaveBeenLastCalledWith(
      "task1",
      { system: "pipeline", topic: "pipeline.running.001" },
      expect.objectContaining({
        runtimeBrick: {
          element: sourceElem,
        },
        error: {
          action: "console.log",
        },
        success: {
          action: "console.log",
        },
      })
    );
    expect(mockMessageDispatcher.unsubscribe).toHaveBeenLastCalledWith(
      "task1",
      { system: "pipeline", topic: "pipeline.running.001" },
      expect.objectContaining({
        runtimeBrick: {
          element: sourceElem,
        },
        error: {
          action: "console.log",
        },
        success: {
          action: "console.log",
        },
      })
    );

    expect(mockMessageSuccess).toHaveBeenCalledTimes(1);
    expect(mockMessageError).toHaveBeenCalledTimes(1);
    expect(mockMessageInfo).toHaveBeenCalledTimes(1);
    expect(mockMessageWarn).toHaveBeenCalledTimes(1);

    expect(applyTheme).toHaveBeenNthCalledWith(1, "light");
    expect(applyTheme).toHaveBeenNthCalledWith(2, "dark");
    expect(applyTheme).toHaveBeenNthCalledWith(3, "dark-v2");
    expect(applyMode).toHaveBeenNthCalledWith(1, "default");
    expect(applyMode).toHaveBeenNthCalledWith(2, "dashboard");

    expect(clearMenuTitleCache).toHaveBeenCalledTimes(1);
    expect(clearMenuCache).toHaveBeenCalledTimes(1);

    (console.log as jest.Mock).mockClear();
    (console.info as jest.Mock).mockClear();
    (console.warn as jest.Mock).mockClear();
    (console.error as jest.Mock).mockClear();
    (applyTheme as jest.Mock).mockClear();
    (applyMode as jest.Mock).mockClear();
    (clearMenuTitleCache as jest.Mock).mockClear();
    (clearMenuCache as jest.Mock).mockClear();
    (localStorage.setItem as jest.Mock).mockClear();
    (localStorage.removeItem as jest.Mock).mockClear();
    (sessionStorage.setItem as jest.Mock).mockClear();
    (sessionStorage.removeItem as jest.Mock).mockClear();

    unbindListeners(sourceElem);
    sourceElem.dispatchEvent(event1);
    expect(console.log).not.toBeCalled();

    (console.log as jest.Mock).mockRestore();
    (console.info as jest.Mock).mockRestore();
    (console.warn as jest.Mock).mockRestore();
    (console.error as jest.Mock).mockRestore();
    sourceElem.remove();
    targetElem.remove();
    targetElem2.remove();
    legacyIframeMountPoint.remove();
  });

  it("should work for template", async () => {
    // Mocking a custom template with several inside bricks.
    const tplElement = document.createElement("div") as any;
    const button = document.createElement("div") as any;
    const microView = document.createElement("div") as any;
    const sourceElem = document.createElement("div") as any;
    const useBrickElem = document.createElement("div") as any;
    useBrickElem.id = "useBrickEle";
    tplElement.$$typeof = "custom-template";
    tplElement.$$getElementByRef = (ref: string) =>
      ref === "button" ? button : undefined;
    tplElement.appendChild(button);
    tplElement.appendChild(microView);
    microView.appendChild(sourceElem);
    microView.appendChild(useBrickElem);
    document.body.appendChild(tplElement);

    const tplContext = new CustomTemplateContext({
      element: tplElement,
    });
    tplElement[symbolForTplContextId] = tplContext.id;
    tplContext.state.set("myState", {
      type: "free-variable",
      value: "initial",
    });
    tplContext.state.set("myLazyState", {
      type: "free-variable",
      value: "initial",
      load(options) {
        return Promise.resolve(
          `[cache:${options.cache ?? "default"}] lazily updated`
        );
      },
    });

    button.forGood = jest.fn();
    button.forArray = jest.fn();
    jest.spyOn(console, "error").mockImplementation(() => void 0);
    const tplDispatchEvent = jest.spyOn(tplElement, "dispatchEvent");

    bindListeners(
      sourceElem,
      {
        keyWillFindTarget: [
          {
            target: "<% `#${EVENT.detail.id}` %>",
            properties: {
              isEdit: true,
            },
          },
          {
            targetRef: '<% "button" %>',
            method: "forGood",
          },
          {
            targetRef: ["button"],
            method: "forArray",
          },
          {
            action: "state.update",
            args: ["myState", "<% `${STATE.myState}:updated` %>"],
          },
          {
            action: "state.update",
            batch: true,
            args: [
              {
                name: "myState",
                value: "<% `${STATE.myState}:batchUpdate` %>",
              },
            ],
          },
          {
            action: "state.update",
            batch: false,
            args: [
              {
                name: "myState",
                value: "<% `${STATE.myState}:unBatchUpdate` %>",
              },
            ],
          },
          {
            action: "state.load",
            args: ["myLazyState"],
          },
        ],
        keyWillNotFindTarget: {
          targetRef: "not-existed",
          method: "forGood",
        },
      },
      {
        tplContextId: tplContext.id,
      } as any
    );

    bindListeners(
      useBrickElem,
      {
        triggeredByUseBrick: {
          action: "tpl.dispatchEvent",
          args: [
            "customizedEventFromUseBrick",
            {
              detail: "<% `quality is ${EVENT.detail}` %>",
            },
          ],
        },
      },
      {
        tplContextId: tplContext.id,
      } as any
    );

    sourceElem.dispatchEvent(new CustomEvent("keyWillNotFindTarget"));
    expect(button.forGood).not.toBeCalled();
    expect(console.error as jest.Mock).toBeCalledWith(
      "target not found:",
      "not-existed"
    );

    sourceElem.dispatchEvent(
      new CustomEvent("keyWillFindTarget", {
        detail: {
          id: "useBrickEle",
        },
      })
    );
    expect(button.forGood).toBeCalled();
    expect(button.forArray).toBeCalled();
    expect(tplContext.state.getValue("myState")).toBe(
      "initial:updated:batchUpdate:unBatchUpdate"
    );

    expect(useBrickElem.isEdit).toBe(true);

    useBrickElem.dispatchEvent(
      new CustomEvent("triggeredByUseBrick", {
        detail: "good",
      })
    );
    expect(tplDispatchEvent).toBeCalledTimes(1);
    expect((tplDispatchEvent.mock.calls[0][0] as CustomEvent).type).toBe(
      "customizedEventFromUseBrick"
    );
    expect((tplDispatchEvent.mock.calls[0][0] as CustomEvent).detail).toBe(
      "quality is good"
    );

    expect(tplContext.state.getValue("myLazyState")).toBe("initial");
    await (global as any).flushPromises();
    expect(tplContext.state.getValue("myLazyState")).toBe(
      "[cache:default] lazily updated"
    );

    tplElement.remove();
    (console.error as jest.Mock).mockRestore();
  });

  it("should work for when `if` rejected", () => {
    jest.spyOn(console, "log").mockImplementation(() => void 0);

    const sourceElem = document.createElement("div");
    const targetElem = document.createElement("div") as any;
    targetElem.id = "target-elem";
    targetElem.forGood = jest.fn();
    document.body.appendChild(sourceElem);
    document.body.appendChild(targetElem);

    const handlers: BrickEventHandler[] = [
      { action: "history.push", if: "<% !EVENT.detail.rejected %>" },
      { action: "history.reload", if: "<% !EVENT.detail.rejected %>" },
      {
        action: "legacy.go",
        if: "<% !EVENT.detail.rejected %>",
      },
      {
        action: "window.open",
        if: "<% !EVENT.detail.rejected %>",
      },
      {
        action: "location.reload",
        if: "<% !EVENT.detail.rejected %>",
      },
      { action: "segue.push", if: "<% !EVENT.detail.rejected %>" },
      { action: "alias.push", if: "<% !EVENT.detail.rejected %>" },
      { action: "context.assign", if: "<% !EVENT.detail.rejected %>" },
      { action: "event.preventDefault", if: "<% !EVENT.detail.rejected %>" },
      { action: "console.log", if: "<% !EVENT.detail.rejected %>" },
      {
        action: "theme.setDarkTheme",
        if: "<% !EVENT.detail.rejected %>",
      },
      {
        action: "theme.setTheme",
        if: "<% !EVENT.detail.rejected %>",
      },
      {
        action: "mode.setDashboardMode",
        if: "<% !EVENT.detail.rejected %>",
      },
      {
        action: "menu.clearMenuTitleCache",
        if: "<% !EVENT.detail.rejected %>",
      },
      {
        action: "menu.clearMenuCache",
        if: "<% !EVENT.detail.rejected %>",
      },
      {
        target: "#target-elem",
        if: "<% !EVENT.detail.rejected %>",
        method: "forGood",
      },
      {
        action: "localStorage.removeItem",
        args: ["visit-history"],
        if: "<% !EVENT.detail.rejected %>",
      },
      {
        action: "sessionStorage.removeItem",
        args: ["visit-history"],
        if: "<% !EVENT.detail.rejected %>",
      },
    ];
    bindListeners(sourceElem, { ifWillGetRejected: handlers }, {} as any);
    sourceElem.dispatchEvent(
      new CustomEvent("ifWillGetRejected", {
        detail: {
          rejected: true,
        },
      })
    );

    expect(console.log as jest.Mock).not.toBeCalled();
    expect(targetElem.forGood).not.toBeCalled();
    expect(applyTheme).not.toBeCalled();
    expect(applyMode).not.toBeCalled();
    expect(clearMenuTitleCache).not.toBeCalled();
    expect(clearMenuCache).not.toBeCalled();
    expect(localStorage.removeItem).not.toBeCalled();
    expect(sessionStorage.removeItem).not.toBeCalled();

    (console.log as jest.Mock).mockRestore();
    sourceElem.remove();
    targetElem.remove();
  });
});

describe("if/esle condition", () => {
  it("basic", async () => {
    jest.spyOn(console, "log").mockImplementation(() => void 0);
    const event = new CustomEvent("response", { detail: "ok" });

    listenerFactory(
      {
        if: true,
        then: [
          {
            useProvider: "any-provider",
            args: [10, "resolved"],
            callback: {
              success: [
                {
                  if: "<% true %>",
                  then: [
                    {
                      action: "console.log",
                      args: ["进入 then 逻辑"],
                    },
                    {
                      useProvider: "any-provider",
                      args: [10, "nest-provider"],
                      callback: {
                        success: [
                          {
                            if: "<% true %>",
                            then: {
                              action: "console.log",
                              args: ["进入嵌套 provider 逻辑"],
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
                  if: "<% false %>",
                  then: [],
                  else: [
                    {
                      action: "console.log",
                      args: ["进入 else 逻辑"],
                    },
                    {
                      if: "<% false %>",
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
                  useProvider: "any-provider",
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
      {},
      {}
    )(event);

    await jest.runAllTimers();
    await (global as any).flushPromises();
    await jest.runAllTimers();
    await (global as any).flushPromises();
    await jest.runAllTimers();
    await (global as any).flushPromises();

    expect(console.log as jest.Mock).toBeCalledTimes(7);

    expect(console.log as jest.Mock).toHaveBeenNthCalledWith(
      1,
      "进入 then 逻辑"
    );

    expect(console.log as jest.Mock).toHaveBeenNthCalledWith(
      2,
      "进入嵌套 then 逻辑"
    );

    expect(console.log as jest.Mock).toHaveBeenNthCalledWith(
      3,
      "进入 else 逻辑"
    );

    expect(console.log as jest.Mock).toHaveBeenNthCalledWith(
      4,
      "进入嵌套 else 逻辑"
    );

    expect(console.log as jest.Mock).toHaveBeenNthCalledWith(5, "执行");

    expect(console.log as jest.Mock).toHaveBeenNthCalledWith(6, "执行");

    expect(console.log as jest.Mock).toHaveBeenNthCalledWith(
      7,
      "进入嵌套 provider 逻辑"
    );
  });
});
