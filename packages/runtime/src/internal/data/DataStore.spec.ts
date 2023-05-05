import { jest, describe, test, expect, afterEach } from "@jest/globals";
import { createProviderClass } from "@next-core/utils/storyboard";
import type { RuntimeContext } from "../interfaces.js";
import { DataStore } from "./DataStore.js";
import { clearResolveCache } from "./resolveData.js";

const consoleWarn = jest.spyOn(console, "warn");
const consoleInfo = jest.spyOn(console, "info");

const myTimeoutProvider = jest.fn(
  (timeout: number, result: string) =>
    new Promise((resolve) => {
      setTimeout(() => resolve(result), timeout);
    })
);
customElements.define(
  "my-timeout-provider",
  createProviderClass(myTimeoutProvider)
);

afterEach(() => {
  clearResolveCache();
});

describe("DataStore: resolve and wait", () => {
  // Sometimes `waitFor` will be stuck and multi macro tasks will be executed
  // in a batch, so we set a retry.
  jest.retryTimes(2, {
    logErrorsBeforeRetry: true,
  });

  const createContextStore = (provider = "my-timeout-provider") => {
    const ctxStore = new DataStore("CTX");
    const runtimeContext = {
      ctxStore,
    } as Partial<RuntimeContext> as RuntimeContext;
    // Dependency map:
    //
    // ```
    //      d
    //     ↙ ↘
    //   b′|b  c  f
    //  ↙ ↘ ↓ ↙   ↓
    // x  a′|a    e
    // ```
    //
    // Explain:
    //   - d depends on b(or b′) and c.
    //   - b′ depends on x and a′.
    //   - b depends on a(or a′).
    //   - c depends on a(or a′).
    //   - f depends on e.
    //
    // a′ and b′ will be ignored (by a falsy result of `if`).
    //
    // Resolve in waterfall:
    //
    // ```
    //     0    100   200   300   400
    //     ·     ·     ·     ·     ·
    //   a |====>
    //   b       |====>
    //   c       |==========>
    //   d                   |====>
    //   e |========>
    //   f           |====>
    //   x |==>
    // ```
    ctxStore.define(
      [
        {
          name: "a",
          resolve: {
            useProvider: provider,
            args: [100, "False-A"],
            if: "<% false %>",
          },
        },
        {
          name: "a",
          resolve: {
            useProvider: provider,
            args: [100, "A"],
          },
          if: "<% true %>",
        },
        {
          name: "b",
          resolve: {
            useProvider: provider,
            args: [100, "<% 'False-B:' + CTX.a + ',' + CTX.x %>"],
          },
          if: "<% false %>",
        },
        {
          name: "b",
          resolve: {
            useProvider: provider,
            args: [100, "<% 'B:' + CTX.a + ',1' %>"],
            if: "<% true %>",
          },
        },
        {
          name: "c",
          resolve: {
            useProvider: provider,
            args: [200, "<% 'C:' + CTX.a + ',3' %>"],
          },
        },
        {
          name: "d",
          resolve: {
            useProvider: provider,
            args: [100, "<% 'D:' + CTX.b + ',' + CTX.c %>"],
          },
        },
        {
          name: "e",
          resolve: {
            useProvider: provider,
            args: [150, "E"],
          },
        },
        {
          name: "f",
          resolve: {
            useProvider: provider,
            args: [100, "<% 'F:' + CTX.e + ',5' %>"],
          },
        },
        {
          name: "x",
          resolve: {
            useProvider: provider,
            args: [50, "X"],
          },
        },
      ],
      runtimeContext
    );
    return {
      ctxStore,
      getAllValues() {
        return Object.fromEntries(
          ["a", "b", "c", "d", "e", "f", "x"].map((k) => [
            k,
            ctxStore.getValue(k),
          ])
        );
      },
    };
  };

  test("Resolve sequence", async () => {
    jest.useFakeTimers();
    const { getAllValues } = createContextStore();
    expect(getAllValues()).toEqual({});

    await (global as any).flushPromises();
    jest.advanceTimersByTime(50);
    await (global as any).flushPromises();
    expect(getAllValues()).toEqual({
      x: "X",
    });

    jest.advanceTimersByTime(50);
    await (global as any).flushPromises();
    expect(getAllValues()).toEqual({
      a: "A",
      x: "X",
    });

    jest.advanceTimersByTime(50);
    await (global as any).flushPromises();
    expect(getAllValues()).toEqual({
      a: "A",
      e: "E",
      x: "X",
    });

    jest.advanceTimersByTime(50);
    await (global as any).flushPromises();
    expect(getAllValues()).toEqual({
      a: "A",
      b: "B:A,1",
      e: "E",
      x: "X",
    });

    jest.advanceTimersByTime(50);
    await (global as any).flushPromises();
    expect(getAllValues()).toEqual({
      a: "A",
      b: "B:A,1",
      e: "E",
      f: "F:E,5",
      x: "X",
    });

    jest.advanceTimersByTime(50);
    await (global as any).flushPromises();
    expect(getAllValues()).toEqual({
      a: "A",
      b: "B:A,1",
      c: "C:A,3",
      e: "E",
      f: "F:E,5",
      x: "X",
    });

    jest.advanceTimersByTime(100);
    await (global as any).flushPromises();
    expect(getAllValues()).toEqual({
      a: "A",
      b: "B:A,1",
      c: "C:A,3",
      d: "D:B:A,1,C:A,3",
      e: "E",
      f: "F:E,5",
      x: "X",
    });
    jest.useRealTimers();
  });

  test("Wait for specific context", async () => {
    const { ctxStore, getAllValues } = createContextStore();
    expect(getAllValues()).toEqual({});

    await ctxStore.waitFor(["x"]);
    expect(getAllValues()).toEqual({
      x: "X",
    });

    await ctxStore.waitFor(["a"]);
    expect(getAllValues()).toEqual({
      a: "A",
      x: "X",
    });

    await ctxStore.waitFor(["e"]);
    expect(getAllValues()).toEqual({
      a: "A",
      e: "E",
      x: "X",
    });

    await ctxStore.waitFor(["b"]);
    expect(getAllValues()).toEqual({
      a: "A",
      b: "B:A,1",
      e: "E",
      x: "X",
    });

    await ctxStore.waitFor(["f"]);
    expect(getAllValues()).toEqual({
      a: "A",
      b: "B:A,1",
      e: "E",
      f: "F:E,5",
      x: "X",
    });

    await ctxStore.waitFor(["c"]);
    expect(getAllValues()).toEqual({
      a: "A",
      b: "B:A,1",
      c: "C:A,3",
      e: "E",
      f: "F:E,5",
      x: "X",
    });

    await ctxStore.waitFor(["d"]);
    expect(getAllValues()).toEqual({
      a: "A",
      b: "B:A,1",
      c: "C:A,3",
      d: "D:B:A,1,C:A,3",
      e: "E",
      f: "F:E,5",
      x: "X",
    });
  });

  test("Wait for all", async () => {
    const { ctxStore, getAllValues } = createContextStore();
    expect(getAllValues()).toEqual({});
    await ctxStore.waitForAll();
    expect(getAllValues()).toEqual({
      a: "A",
      b: "B:A,1",
      c: "C:A,3",
      d: "D:B:A,1,C:A,3",
      e: "E",
      f: "F:E,5",
      x: "X",
    });
  });
});

describe("DataStore", () => {
  test("context.assign", async () => {
    const ctxStore = new DataStore("CTX");
    const runtimeContext = {
      ctxStore,
    } as Partial<RuntimeContext> as RuntimeContext;
    ctxStore.define(
      [
        {
          name: "object",
          resolve: {
            useProvider: "my-timeout-provider",
            args: [100, "ignored"],
            if: false,
          },
          value: {
            quality: "good",
          },
        },
        {
          name: "primitive",
          value: "any",
        },
      ],
      runtimeContext
    );
    await ctxStore.waitForAll();
    expect(ctxStore.getValue("object")).toEqual({ quality: "good" });
    expect(ctxStore.getValue("primitive")).toBe("any");

    ctxStore.updateValue("object", { amount: 42 }, "assign");
    expect(ctxStore.getValue("object")).toEqual({
      quality: "good",
      amount: 42,
    });

    expect(consoleWarn).not.toBeCalled();
    consoleWarn.mockReturnValueOnce();
    ctxStore.updateValue("primitive", { amount: 42 }, "assign");
    expect(ctxStore.getValue("primitive")).toEqual({ amount: 42 });
    expect(consoleWarn).toBeCalledTimes(1);
    expect(consoleWarn).toBeCalledWith(expect.stringContaining("Non-object"));
  });

  test("state and onChange", async () => {
    const tplStateStoreId = "tpl-state-1";
    const tplStateStoreMap = new Map<string, DataStore<"STATE">>();
    const runtimeContext = {
      tplStateStoreId,
      tplStateStoreMap,
    } as Partial<RuntimeContext> as RuntimeContext;
    const stateStore = new DataStore("STATE");
    tplStateStoreMap.set(tplStateStoreId, stateStore);
    stateStore.define(
      [
        {
          name: "a",
          value: 1,
          onChange: {
            action: "state.update",
            args: ["b", "<% EVENT.detail + 40 %>"],
          },
        },
        {
          name: "b",
          value: 0,
        },
        {
          name: "c",
          expose: true,
        },
        {
          name: "d",
        },
      ],
      runtimeContext,
      Promise.resolve({
        b: 7,
        c: 8,
        d: 9,
      })
    );
    await stateStore.waitForAll();
    expect(stateStore.getValue("a")).toBe(1);
    expect(stateStore.getValue("b")).toBe(0);
    expect(stateStore.getValue("c")).toBe(8);
    expect(stateStore.getValue("d")).toBe(undefined);
    stateStore.updateValue("a", 2, "replace");
    expect(stateStore.getValue("a")).toBe(2);
    expect(stateStore.getValue("b")).toBe(42);
  });

  test("lazy, load and track", async () => {
    consoleInfo.mockReturnValue();
    const ctxStore = new DataStore("CTX");
    const runtimeContext = {
      ctxStore,
    } as Partial<RuntimeContext> as RuntimeContext;
    ctxStore.define(
      [
        {
          name: "asyncValue",
          resolve: {
            useProvider: "my-timeout-provider",
            args: [100, "lazily updated"],
            lazy: true,
          },
          value: "initial",
        },
        {
          name: "processedData",
          value: "<% `processed: ${CTX.asyncValue}` %>",
          track: true,
        },
      ],
      runtimeContext
    );
    await ctxStore.waitForAll();
    expect(ctxStore.getValue("asyncValue")).toBe("initial");
    expect(ctxStore.getValue("processedData")).toBe("processed: initial");
    expect(myTimeoutProvider).not.toBeCalled();

    // Trigger load twice.
    ctxStore.updateValue("asyncValue", undefined, "load", {
      success: {
        action: "console.info",
        args: ["[1] success", "<% EVENT.detail %>"],
      },
      finally: {
        action: "console.info",
        args: ["[1] finally", "<% EVENT.detail %>"],
      },
    });
    ctxStore.updateValue("asyncValue", undefined, "load", {
      success: {
        action: "console.info",
        args: ["[2] success", "<% EVENT.detail %>"],
      },
      finally: {
        action: "console.info",
        args: ["[2] finally", "<% EVENT.detail %>"],
      },
    });
    expect(ctxStore.getValue("asyncValue")).toBe("initial");

    await (global as any).flushPromises();
    // Will not load again if it is already LOADING.
    expect(myTimeoutProvider).toBeCalledTimes(1);
    expect(consoleInfo).not.toBeCalled();
    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });
    expect(ctxStore.getValue("asyncValue")).toBe("lazily updated");
    expect(ctxStore.getValue("processedData")).toBe(
      "processed: lazily updated"
    );

    expect(consoleInfo).toBeCalledTimes(4);
    expect(consoleInfo).toHaveBeenNthCalledWith(1, "[1] success", {
      value: "lazily updated",
    });
    expect(consoleInfo).toHaveBeenNthCalledWith(2, "[1] finally", null);
    expect(consoleInfo).toHaveBeenNthCalledWith(3, "[2] success", {
      value: "lazily updated",
    });
    expect(consoleInfo).toHaveBeenNthCalledWith(4, "[2] finally", null);

    ctxStore.updateValue("asyncValue", undefined, "load", {
      success: {
        action: "console.info",
        args: ["[3] success", "<% EVENT.detail %>"],
      },
      finally: {
        action: "console.info",
        args: ["[3] finally", "<% EVENT.detail %>"],
      },
    });
    await (global as any).flushPromises();
    // Will not load again if it is already LOADED.
    expect(myTimeoutProvider).toBeCalledTimes(1);
    expect(consoleInfo).toBeCalledTimes(6);
    expect(consoleInfo).toHaveBeenNthCalledWith(5, "[3] success", {
      value: "lazily updated",
    });
    expect(consoleInfo).toHaveBeenNthCalledWith(6, "[3] finally", null);

    consoleInfo.mockReset();
  });

  test("load context without resolve", async () => {
    const ctxStore = new DataStore("CTX");
    const runtimeContext = {
      ctxStore,
    } as Partial<RuntimeContext> as RuntimeContext;
    ctxStore.define([{ name: "a", value: 1 }], runtimeContext);
    await ctxStore.waitForAll();
    expect(() => {
      ctxStore.updateValue("a", undefined, "load");
    }).toThrowErrorMatchingInlineSnapshot(
      `"You can not load "CTX.a" which has no resolve"`
    );
  });

  test("update undefined context", async () => {
    const ctxStore = new DataStore("CTX");
    await ctxStore.waitForAll();
    expect(() => {
      ctxStore.updateValue("notExisted", "oops", "replace");
    }).toThrowErrorMatchingInlineSnapshot(`"CTX 'notExisted' is not defined"`);
  });
});
