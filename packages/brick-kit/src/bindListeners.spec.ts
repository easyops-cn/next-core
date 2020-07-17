/* eslint-disable no-console */
import { BrickEventHandler, BrickEventsMap } from "@easyops/brick-types";
import {
  isBuiltinHandler,
  isCustomHandler,
  bindListeners,
  unbindListeners,
} from "./bindListeners";
import { getHistory } from "./history";
import * as runtime from "./core/Runtime";

jest.mock("./history");

// Mock a custom element of `any-provider`.
customElements.define(
  "any-provider",
  class Tmp extends HTMLElement {
    resolve(): string {
      return "resolved";
    }
  }
);

const mockHistory = {
  push: jest.fn(),
  replace: jest.fn(),
  pushQuery: jest.fn(),
  replaceQuery: jest.fn(),
  pushAnchor: jest.fn(),
  reload: jest.fn(),
  goBack: jest.fn(),
  goForward: jest.fn(),
  location: {
    search: "?page=3",
  },
};
(getHistory as jest.Mock).mockReturnValue(mockHistory);

const storyboardContext = new Map<string, any>();
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

const anyProvider = document.createElement("any-provider");
jest.spyOn(runtime, "_internalApiGetProviderBrick").mockImplementation(
  async (provider: string): Promise<HTMLElement> => {
    await Promise.resolve();
    if (provider === "any-provider") {
      return anyProvider;
    }
    throw new Error(`Provider not defined: "${provider}".`);
  }
);

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
  beforeEach(() => {
    storyboardContext.clear();
    const ctx: [string, any][] = [
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
        },
      ],
      [
        "myPropContext",
        {
          type: "brick-property",
          brick: {
            element: {
              quality: "better",
            },
          },
          prop: "quality",
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

    const eventsMap: BrickEventsMap = {
      key1: [
        { action: "history.push" },
        {
          action: "history.replace",
          args: ["specified args for history.replace"],
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
        { action: "segue.push", args: ["testSegueIdA"] },
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
          action: "context.replace",
          args: ["myStringContext", "not-bad"],
        },
        {
          action: "context.assign",
          args: [
            "myNumberContext",
            {
              number: "<% CTX.myNumberContext %>",
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
          action: "context.assign",
          args: [
            100,
            {
              something: "wrong",
            },
          ],
        },
      ],
      key2: [
        { target: "#target-elem", method: "forGood" },
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
            success: {
              action: "console.log",
            },
            error: {
              action: "console.error",
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
              action: "console.error",
            },
            finally: {
              action: "console.info",
            },
          },
        },
        { target: "#target-elem", method: "notExisted" },
        { target: "#not-existed", method: "forGood" },
        {
          target: "#target-elem",
          properties: { someProperty: "${EVENT.detail}" },
        },
        {
          useProvider: "any-provider",
          args: ["for", "${EVENT.detail}"],
          callback: {
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
      ],
      key3: { action: "not.existed" },
      key4: {},
    } as any;

    const location = window.location;
    delete window.location;
    window.location = ({
      origin: "http://www.google.com",
      reload: jest.fn(),
      assign: jest.fn(),
    } as unknown) as Location;

    jest.spyOn(console, "log").mockImplementation(() => void 0);
    jest.spyOn(console, "info").mockImplementation(() => void 0);
    jest.spyOn(console, "warn").mockImplementation(() => void 0);
    jest.spyOn(console, "error").mockImplementation(() => void 0);
    window.open = jest.fn();

    bindListeners(sourceElem, eventsMap);

    const event1 = new CustomEvent("key1", {
      detail: "for-good",
    });
    const spyOnPreventDefault = jest.spyOn(event1, "preventDefault");
    sourceElem.dispatchEvent(event1);
    const event2 = new CustomEvent("key2", {
      detail: "for-better",
    });
    sourceElem.dispatchEvent(event2);

    await jest.runAllTimers();
    await (global as any).flushPromises();

    expect(iframeElement.contentWindow.postMessage).toBeCalledWith(
      {
        type: "location.url",
        url: "www.google.com",
      },
      "http://www.google.com"
    );

    const history = mockHistory;
    expect(history.push).toHaveBeenNthCalledWith(1, "for-good");
    expect(history.push).toHaveBeenNthCalledWith(2, "/segue-target-a");
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
      "specified args for history.replace"
    );
    expect(history.replace).toHaveBeenNthCalledWith(
      2,
      "/segue-target-b/for-good"
    );
    expect(history.replace).toHaveBeenNthCalledWith(
      3,
      "/mock/alias/b/for-good"
    );
    expect(history.replaceQuery).toBeCalledWith({
      page: 1,
    });
    expect(history.pushAnchor).toBeCalledWith("yes");
    expect(history.goBack).toBeCalledWith();
    expect(history.goForward).toBeCalledWith();
    expect(history.reload).toBeCalled();

    expect(window.location.reload).toBeCalledWith();
    expect(window.location.assign).toBeCalledWith("www.baidu.com");

    window.location = location;

    expect(spyOnPreventDefault).toBeCalled();

    expect(console.log).toBeCalledTimes(3);
    expect(console.log).toHaveBeenNthCalledWith(1, event1);
    expect((console.log as jest.Mock).mock.calls[1][0].type).toBe(
      "callback.success"
    );
    expect((console.log as jest.Mock).mock.calls[1][0].detail).toBe("yes");
    expect((console.log as jest.Mock).mock.calls[2][0].type).toBe(
      "callback.success"
    );
    expect((console.log as jest.Mock).mock.calls[2][0].detail).toBe("resolved");
    expect(console.info).toBeCalledTimes(2);
    expect(console.info).toBeCalledWith(event1);
    expect((console.info as jest.Mock).mock.calls[1][0].type).toBe(
      "callback.finally"
    );
    expect(console.warn).toBeCalledWith("specified args for console.warn");
    expect(console.error).toBeCalledTimes(7);
    expect(console.error).toHaveBeenNthCalledWith(
      1,
      "specified args for console.error"
    );
    expect((console.error as jest.Mock).mock.calls[3][0]).toBe(
      "target has no method:"
    );
    expect((console.error as jest.Mock).mock.calls[3][1].method).toBe(
      "notExisted"
    );
    expect(console.error).toHaveBeenNthCalledWith(
      5,
      "target not found:",
      "#not-existed"
    );
    expect(console.error).toHaveBeenNthCalledWith(
      6,
      'Error: Provider not defined: "not-defined-provider".'
    );
    expect((console.error as jest.Mock).mock.calls[6][0].type).toBe(
      "callback.error"
    );
    expect((console.error as jest.Mock).mock.calls[6][0].detail).toBe("oops");
    expect((sourceElem as any).forGood).toHaveBeenNthCalledWith(
      1,
      "target is _self"
    );
    expect((targetElem as any).forGood).toHaveBeenNthCalledWith(1, event2);
    expect((targetElem as any).forGood).toHaveBeenNthCalledWith(
      2,
      "specified args for multiple"
    );
    expect(window.open).toBeCalledWith("www.google.com", "_self");
    expect((targetElem2 as any).forGood).toHaveBeenNthCalledWith(
      1,
      "specified args for multiple"
    );
    expect((targetElem as any).someProperty).toBe(event2.detail);

    expect(storyboardContext.get("myStringContext").value).toBe("not-bad");
    expect(storyboardContext.get("myNumberContext").value).toEqual({
      number: 3,
    });
    expect(storyboardContext.get("myObjectContext").value).toEqual({
      quality: "better",
      checked: true,
    });
    expect(storyboardContext.get("myNewContext").value).toEqual({
      hello: "world",
    });

    (console.log as jest.Mock).mockClear();
    (console.info as jest.Mock).mockClear();
    (console.warn as jest.Mock).mockClear();
    (console.error as jest.Mock).mockClear();

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

  it("should work for ref target", () => {
    // Mocking a custom template with several inside bricks.
    const tplElement = document.createElement("div") as any;
    const button = document.createElement("div") as any;
    const microView = document.createElement("div") as any;
    const sourceElem = document.createElement("div") as any;
    const useBrickElem = document.createElement("div") as any;
    tplElement.$$typeof = "custom-template";
    tplElement.$$getElementByRef = (ref: string) =>
      ref === "button" ? button : undefined;
    tplElement.appendChild(button);
    tplElement.appendChild(microView);
    microView.appendChild(sourceElem);
    microView.appendChild(useBrickElem);
    document.body.appendChild(tplElement);

    button.forGood = jest.fn();
    jest.spyOn(console, "error").mockImplementation(() => void 0);
    const tplDispatchEvent = jest.spyOn(tplElement, "dispatchEvent");

    bindListeners(sourceElem, {
      keyWillFindTarget: {
        targetRef: "button",
        method: "forGood",
      },
      keyWillNotFindTarget: {
        targetRef: "not-existed",
        method: "forGood",
      },
    });

    bindListeners(useBrickElem, {
      triggeredByUseBrick: {
        action: "tpl.dispatchEvent",
        args: [
          "customizedEventFromUseBrick",
          {
            detail: "<% `quality is ${EVENT.detail}` %>",
          },
        ],
      },
    });

    sourceElem.dispatchEvent(new CustomEvent("keyWillNotFindTarget"));
    expect(button.forGood).not.toBeCalled();
    expect(console.error as jest.Mock).toBeCalledWith(
      "target not found:",
      "not-existed"
    );

    sourceElem.dispatchEvent(new CustomEvent("keyWillFindTarget"));
    expect(button.forGood).toBeCalled();

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
        target: "#target-elem",
        if: "<% !EVENT.detail.rejected %>",
        method: "forGood",
      },
    ];
    bindListeners(sourceElem, { ifWillGetRejected: handlers });
    sourceElem.dispatchEvent(
      new CustomEvent("ifWillGetRejected", {
        detail: {
          rejected: true,
        },
      })
    );

    expect(console.log as jest.Mock).not.toBeCalled();
    expect(targetElem.forGood).not.toBeCalled();

    (console.log as jest.Mock).mockRestore();
    sourceElem.remove();
    targetElem.remove();
  });
});
