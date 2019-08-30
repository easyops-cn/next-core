import {
  isBuiltinHandler,
  isCustomHandler,
  bindListeners
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
    it("should work", () => {
      const sourceElem = document.createElement("div");
      const targetElem = document.createElement("div");
      const targetElem2 = document.createElement("div");
      targetElem.id = "target-elem";
      targetElem2.id = "target-elem2";
      (targetElem as any).forGood = jest.fn();
      (targetElem2 as any).forGood = jest.fn();
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
          {
            target: "#target-elem,#target-elem2",
            multiple: true,
            method: "forGood",
            args: ["specified args for multiple"]
          },
          { target: "#target-elem", method: "notExisted" },
          { target: "#not-existed", method: "forGood" }
        ],
        key3: { action: "not.existed" },
        key4: {}
      } as any;
      const history = {
        push: jest.fn(),
        replace: jest.fn()
      } as any;

      jest.spyOn(console, "log");
      jest.spyOn(console, "info");
      jest.spyOn(console, "warn");
      jest.spyOn(console, "error");

      bindListeners(sourceElem, eventsMap, history);

      const event1 = new CustomEvent("key1", {
        detail: "for-good"
      });
      sourceElem.dispatchEvent(event1);
      const event2 = new CustomEvent("key2", {
        detail: "for-better"
      });
      sourceElem.dispatchEvent(event2);

      expect(history.push).toBeCalledWith("for-good");
      expect(history.replace).toBeCalledWith(
        "specified args for history.replace"
      );

      /* eslint-disable no-console */
      expect(console.log).toBeCalledWith(event1);
      expect(console.info).toBeCalledWith(event1);
      expect(console.warn).toBeCalledWith("specified args for console.warn");
      expect(console.error).toBeCalledWith("specified args for console.error");
      expect((targetElem as any).forGood).toBeCalledWith(event2);
      expect((targetElem as any).forGood).toBeCalledWith(
        "specified args for multiple"
      );
      expect((targetElem2 as any).forGood).toBeCalledWith(
        "specified args for multiple"
      );

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
