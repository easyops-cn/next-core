import {
  isBuiltinHandler,
  isCustomHandler,
  bindListeners,
  unbindListeners
} from "./bindListeners";
import { BrickEventHandler, BrickEventsMap } from "@easyops/brick-types";

describe("bindListeners", () => {
  describe("isBuiltinHandler", () => {
    const cases: [BrickEventHandler, boolean][] = [
      [{ target: "", method: "" }, false],
      [{ action: "history.push" }, true]
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
      [{ target: "target", method: "method" }, true]
    ];

    it.each(cases)(
      "isCustomHandler(%j) should return %s",
      (value, expected) => {
        expect(isCustomHandler(value)).toBe(expected);
      }
    );
  });

  describe("bindListeners", () => {
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

      const eventsMap: BrickEventsMap = {
        key1: [
          { action: "history.push" },
          {
            action: "history.replace",
            args: ["specified args for history.replace"]
          },
          {
            action: "history.pushQuery",
            args: [
              {
                q: "123",
                a: undefined,
                list: ["a", "b"]
              },
              {
                extraQuery: {
                  page: 1
                }
              }
            ]
          },
          {
            action: "history.replaceQuery",
            args: [
              {
                page: 1
              }
            ]
          },
          {
            action: "history.pushAnchor",
            args: ["yes"]
          },
          { action: "history.goBack" },
          {
            action: "history.goForward"
          },
          {
            action: "history.reload"
          },
          {
            action: "legacy.go",
            args: ["www.google.com"]
          },
          {
            action: "window.open",
            args: ["www.google.com"]
          },
          {
            action: "location.reload",
            args: [true]
          },
          { action: "location.assign", args: ["www.baidu.com"] },
          { action: "event.preventDefault" },
          { action: "console.log" },
          { action: "console.info" },
          { action: "console.warn", args: ["specified args for console.warn"] },
          {
            action: "console.error",
            args: ["specified args for console.error"]
          }
        ],
        key2: [
          { target: "#target-elem", method: "forGood" },
          { target: "_self", method: "forGood", args: ["target is _self"] },
          {
            target: "#target-elem,#target-elem2",
            multiple: true,
            method: "forGood",
            args: ["specified args for multiple"]
          },
          {
            target: "#target-elem",
            method: "forAsyncWillSuccess",
            callback: {
              success: {
                action: "console.log"
              },
              error: {
                action: "console.error"
              }
            }
          },
          {
            target: "#target-elem2",
            method: "forAsyncWillError",
            callback: {
              success: {
                action: "console.log"
              },
              error: {
                action: "console.error"
              }
            }
          },
          { target: "#target-elem", method: "notExisted" },
          { target: "#not-existed", method: "forGood" },
          {
            target: "#target-elem",
            properties: { someProperty: "${EVENT.detail}" }
          }
        ],
        key3: { action: "not.existed" },
        key4: {}
      } as any;
      const history = {
        push: jest.fn(),
        replace: jest.fn(),
        pushQuery: jest.fn(),
        replaceQuery: jest.fn(),
        pushAnchor: jest.fn(),
        reload: jest.fn(),
        goBack: jest.fn(),
        goForward: jest.fn(),
        location: {
          search: "?page=3"
        }
      } as any;

      const location = window.location;
      delete window.location;
      window.location = ({
        origin: "http://www.google.com",
        reload: jest.fn(),
        assign: jest.fn()
      } as unknown) as Location;

      jest.spyOn(console, "log");
      jest.spyOn(console, "info");
      jest.spyOn(console, "warn");
      jest.spyOn(console, "error");
      window.open = jest.fn();

      const legacyIframeMountPoint = document.createElement("div");
      legacyIframeMountPoint.id = "legacy-iframe-mount-point";
      document.body.appendChild(legacyIframeMountPoint);
      const iframeElement = document.createElement("iframe");
      legacyIframeMountPoint.appendChild(iframeElement);
      (iframeElement.contentWindow as any).angular = {};

      iframeElement.contentWindow.postMessage = jest.fn();

      bindListeners(sourceElem, eventsMap, history);

      const event1 = new CustomEvent("key1", {
        detail: "for-good"
      });
      const spyOnPreventDefault = jest.spyOn(event1, "preventDefault");
      sourceElem.dispatchEvent(event1);
      const event2 = new CustomEvent("key2", {
        detail: "for-better"
      });
      sourceElem.dispatchEvent(event2);

      await jest.runAllTimers();
      await (global as any).flushPromises();

      expect(iframeElement.contentWindow.postMessage).toBeCalledWith(
        {
          type: "location.url",
          url: "www.google.com"
        },
        "http://www.google.com"
      );

      expect(history.push).toBeCalledWith("for-good");
      expect(history.pushQuery).toBeCalledWith(
        {
          q: "123",
          a: undefined,
          list: ["a", "b"]
        },
        {
          extraQuery: {
            page: 1
          }
        }
      );
      expect(history.replace).toBeCalledWith(
        "specified args for history.replace"
      );
      expect(history.replaceQuery).toBeCalledWith({
        page: 1
      });
      expect(history.pushAnchor).toBeCalledWith("yes");
      expect(history.goBack).toBeCalledWith();
      expect(history.goForward).toBeCalledWith();
      expect(history.reload).toBeCalled();

      expect(window.location.reload).toBeCalledWith();
      expect(window.location.assign).toBeCalledWith("www.baidu.com");

      window.location = location;

      expect(spyOnPreventDefault).toBeCalled();

      /* eslint-disable no-console */
      expect(console.log).toBeCalledTimes(2);
      expect(console.log).toHaveBeenNthCalledWith(1, event1);
      expect((console.log as jest.Mock).mock.calls[1][0].type).toBe(
        "callback.success"
      );
      expect((console.log as jest.Mock).mock.calls[1][0].detail).toBe("yes");
      expect(console.info).toBeCalledWith(event1);
      expect(console.warn).toBeCalledWith("specified args for console.warn");
      expect(console.error).toBeCalledTimes(2);
      expect(console.error).toHaveBeenNthCalledWith(
        1,
        "specified args for console.error"
      );
      expect((console.error as jest.Mock).mock.calls[1][0].type).toBe(
        "callback.error"
      );
      expect((console.error as jest.Mock).mock.calls[1][0].detail).toBe("oops");
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
      document.body.removeChild(sourceElem);
      document.body.removeChild(targetElem);
      /* eslint-enable no-console */
    });
  });
});
