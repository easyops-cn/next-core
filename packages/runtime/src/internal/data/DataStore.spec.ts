import { jest, describe, test, expect, afterEach } from "@jest/globals";
import { createProviderClass } from "@next-core/utils/general";
import type { RuntimeContext } from "../interfaces.js";
import { DataStore } from "./DataStore.js";
import { clearResolveCache } from "./resolveData.js";
import { BatchUpdateContextItem } from "@next-core/types";

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

  test("lazy/async, load and track", async () => {
    consoleInfo.mockReturnValue();
    const ctxStore = new DataStore("CTX");
    const runtimeContext = {
      ctxStore,
    } as Partial<RuntimeContext> as RuntimeContext;
    ctxStore.define(
      [
        {
          name: "lazyValue",
          resolve: {
            useProvider: "my-timeout-provider",
            args: [100, "lazily updated"],
            lazy: true,
          },
          value: "initial",
        },
        {
          name: "processedData",
          value: "<% `processed: ${CTX.lazyValue}` %>",
          track: true,
        },
        {
          name: "asyncValue",
          resolve: {
            useProvider: "my-timeout-provider",
            args: [100, "async updated"],
            async: true,
          },
          value: "async initial",
        },
      ],
      runtimeContext
    );
    await ctxStore.waitForAll();
    expect(ctxStore.getValue("lazyValue")).toBe("initial");
    expect(ctxStore.getValue("processedData")).toBe("processed: initial");
    expect(ctxStore.getValue("asyncValue")).toBe("async initial");
    expect(myTimeoutProvider).toBeCalledTimes(1);

    ctxStore.handleAsyncAfterMount();
    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });
    expect(ctxStore.getValue("asyncValue")).toBe("async updated");

    // Trigger load twice.
    ctxStore.updateValue("lazyValue", undefined, "load", {
      success: {
        action: "console.info",
        args: ["[1] success", "<% EVENT.detail %>"],
      },
      finally: {
        action: "console.info",
        args: ["[1] finally", "<% EVENT.detail %>"],
      },
    });
    ctxStore.updateValue("lazyValue", undefined, "load", {
      success: {
        action: "console.info",
        args: ["[2] success", "<% EVENT.detail %>"],
      },
      finally: {
        action: "console.info",
        args: ["[2] finally", "<% EVENT.detail %>"],
      },
    });
    expect(ctxStore.getValue("lazyValue")).toBe("initial");

    await (global as any).flushPromises();
    // Will not load again if it is already LOADING.
    expect(myTimeoutProvider).toBeCalledTimes(2);
    expect(consoleInfo).not.toBeCalled();
    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });
    expect(ctxStore.getValue("lazyValue")).toBe("lazily updated");
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

    ctxStore.updateValue("lazyValue", undefined, "load", {
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
    expect(myTimeoutProvider).toBeCalledTimes(2);
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

describe("batchUpdate should work", () => {
  const argsFactory = (arg: unknown[]): BatchUpdateContextItem => {
    return arg[0] as BatchUpdateContextItem;
  };
  const createContextStore = () => {
    const tplStateStoreId = "tpl-state-batch-update-1";
    const tplStateStoreMap = new Map<string, DataStore<"STATE">>();
    const stateStore = new DataStore("STATE");
    const runtimeContext = {
      tplStateStoreId,
      tplStateStoreMap,
    } as Partial<RuntimeContext> as RuntimeContext;
    tplStateStoreMap.set(tplStateStoreId, stateStore);

    stateStore.define(
      [
        {
          name: "a",
          value: 1,
          track: true,
          onChange: [
            {
              action: "console.info",
              args: ["a change", "<% EVENT.detail %>"],
            },
          ],
        },
        {
          name: "b",
          value: 2,
          track: true,
          onChange: [
            {
              action: "console.info",
              args: ["b change", "<% EVENT.detail %>"],
            },
          ],
        },
        {
          name: "c",
          value: `<% STATE.a + STATE.b %>`,
          track: true,
          onChange: [
            {
              action: "console.info",
              args: ["c change", "<% EVENT.detail %>"],
            },
          ],
        },
        {
          name: "d",
          value: `<% STATE.c + 1 %>`,
          track: true,
          onChange: [
            {
              action: "console.info",
              args: ["d change", "<% EVENT.detail %>"],
            },
          ],
        },
      ],
      runtimeContext
    );
    return {
      stateStore,
    };
  };

  test("update a, and c d should update once", async () => {
    consoleInfo.mockReturnValue();
    const { stateStore } = createContextStore();
    await stateStore.waitForAll();
    stateStore.updateValues(
      [
        {
          name: "a",
          value: 2,
        },
      ],
      "replace",
      argsFactory
    );

    expect(stateStore.getValue("a")).toBe(2);
    expect(stateStore.getValue("c")).toBe(4);
    expect(stateStore.getValue("d")).toBe(5);
    expect(consoleInfo).toBeCalledTimes(3);

    expect(consoleInfo).toHaveBeenNthCalledWith(1, "a change", 2);
    expect(consoleInfo).toHaveBeenNthCalledWith(2, "c change", 4);
    expect(consoleInfo).toHaveBeenNthCalledWith(3, "d change", 5);

    consoleInfo.mockReset();
  });

  test("update a and b, c and d should update once", async () => {
    consoleInfo.mockReturnValue();
    const { stateStore } = createContextStore();
    await stateStore.waitForAll();
    stateStore.updateValues(
      [
        {
          name: "a",
          value: 2,
        },
        {
          name: "b",
          value: 3,
        },
      ],
      "replace",
      argsFactory
    );

    expect(stateStore.getValue("a")).toBe(2);
    expect(stateStore.getValue("b")).toBe(3);
    expect(stateStore.getValue("c")).toBe(5);
    expect(stateStore.getValue("d")).toBe(6);
    expect(consoleInfo).toBeCalledTimes(4);

    expect(consoleInfo).toHaveBeenNthCalledWith(1, "a change", 2);
    expect(consoleInfo).toHaveBeenNthCalledWith(2, "b change", 3);
    expect(consoleInfo).toHaveBeenNthCalledWith(3, "c change", 5);
    expect(consoleInfo).toHaveBeenNthCalledWith(4, "d change", 6);

    consoleInfo.mockReset();
  });

  test("update a and c, and d should update once", async () => {
    consoleInfo.mockReturnValue();
    const { stateStore } = createContextStore();
    await stateStore.waitForAll();
    stateStore.updateValues(
      [
        {
          name: "a",
          value: 2,
        },
        {
          name: "c",
          value: 0,
        },
      ],
      "replace",
      argsFactory
    );

    expect(stateStore.getValue("a")).toBe(2);
    expect(stateStore.getValue("c")).toBe(0);
    expect(stateStore.getValue("d")).toBe(1);
    expect(consoleInfo).toBeCalledTimes(3);

    expect(consoleInfo).toHaveBeenNthCalledWith(1, "a change", 2);
    expect(consoleInfo).toHaveBeenNthCalledWith(2, "c change", 0);
    expect(consoleInfo).toHaveBeenNthCalledWith(3, "d change", 1);

    consoleInfo.mockReset();
  });

  test("update c and a, and d should update once", async () => {
    consoleInfo.mockReturnValue();
    const { stateStore } = createContextStore();
    await stateStore.waitForAll();
    stateStore.updateValues(
      [
        {
          name: "c",
          value: 0,
        },
        {
          name: "a",
          value: 1,
        },
      ],
      "replace",
      argsFactory
    );

    expect(stateStore.getValue("a")).toBe(1);
    expect(stateStore.getValue("c")).toBe(0);
    expect(stateStore.getValue("d")).toBe(1);
    expect(consoleInfo).toBeCalledTimes(3);

    expect(consoleInfo).toHaveBeenNthCalledWith(1, "c change", 0);
    expect(consoleInfo).toHaveBeenNthCalledWith(2, "a change", 1);
    expect(consoleInfo).toHaveBeenNthCalledWith(3, "d change", 1);

    consoleInfo.mockReset();
  });

  test("update a, b, c, and d should update once", async () => {
    consoleInfo.mockReturnValue();
    const { stateStore } = createContextStore();
    await stateStore.waitForAll();
    stateStore.updateValues(
      [
        {
          name: "a",
          value: 10,
        },
        {
          name: "b",
          value: 20,
        },
        {
          name: "c",
          value: 100,
        },
      ],
      "replace",
      argsFactory
    );

    expect(stateStore.getValue("a")).toBe(10);
    expect(stateStore.getValue("b")).toBe(20);
    expect(stateStore.getValue("c")).toBe(100);
    expect(stateStore.getValue("d")).toBe(101);
    expect(consoleInfo).toBeCalledTimes(4);

    expect(consoleInfo).toHaveBeenNthCalledWith(1, "a change", 10);
    expect(consoleInfo).toHaveBeenNthCalledWith(2, "b change", 20);
    expect(consoleInfo).toHaveBeenNthCalledWith(3, "c change", 100);
    expect(consoleInfo).toHaveBeenNthCalledWith(4, "d change", 101);

    consoleInfo.mockReset();
  });

  test("update c, and d should update once", async () => {
    consoleInfo.mockReturnValue();
    const { stateStore } = createContextStore();
    await stateStore.waitForAll();
    stateStore.updateValues(
      [
        {
          name: "c",
          value: 20,
        },
      ],
      "replace",
      argsFactory
    );

    expect(stateStore.getValue("c")).toBe(20);
    expect(stateStore.getValue("d")).toBe(21);
    expect(consoleInfo).toBeCalledTimes(2);

    expect(consoleInfo).toHaveBeenNthCalledWith(1, "c change", 20);
    expect(consoleInfo).toHaveBeenNthCalledWith(2, "d change", 21);

    consoleInfo.mockReset();
  });

  test("update d c, not emit", async () => {
    consoleInfo.mockReturnValue();
    const { stateStore } = createContextStore();
    await stateStore.waitForAll();
    stateStore.updateValues(
      [
        {
          name: "d",
          value: 10,
        },
        {
          name: "c",
          value: 20,
        },
      ],
      "replace",
      argsFactory
    );

    expect(stateStore.getValue("d")).toBe(10);
    expect(stateStore.getValue("c")).toBe(20);
    expect(consoleInfo).toBeCalledTimes(2);

    expect(consoleInfo).toHaveBeenNthCalledWith(1, "d change", 10);
    expect(consoleInfo).toHaveBeenNthCalledWith(2, "c change", 20);

    consoleInfo.mockReset();
  });

  test("not allow to update same item", async () => {
    const { stateStore } = createContextStore();
    await stateStore.waitForAll();
    expect(() => {
      stateStore.updateValues(
        [
          {
            name: "a",
            value: 1,
          },
          {
            name: "b",
            value: 2,
          },
          {
            name: "a",
            value: 1,
          },
        ],
        "replace",
        argsFactory
      );
    }).toThrowErrorMatchingInlineSnapshot(
      `"Batch update not allow to update same item"`
    );
  });
});

describe("batchUpdate with resolve should work", () => {
  const argsFactory = (arg: unknown[]): BatchUpdateContextItem => {
    return arg[0] as BatchUpdateContextItem;
  };
  const createContextStore = () => {
    const tplStateStoreId = "tpl-state-batch-update-2";
    const tplStateStoreMap = new Map<string, DataStore<"STATE">>();
    const stateStore = new DataStore("STATE");
    const runtimeContext = {
      tplStateStoreId,
      tplStateStoreMap,
    } as Partial<RuntimeContext> as RuntimeContext;
    tplStateStoreMap.set(tplStateStoreId, stateStore);

    stateStore.define(
      [
        {
          name: "a",
          value: 1,
          track: true,
          onChange: [
            {
              action: "console.info",
              args: ["a change", "<% EVENT.detail %>"],
            },
          ],
        },
        {
          name: "b",
          value: 2,
          track: true,
          onChange: [
            {
              action: "console.info",
              args: ["b change", "<% EVENT.detail %>"],
            },
          ],
        },
        {
          name: "c",
          value: `<% STATE.a + STATE.b %>`,
          track: true,
          onChange: [
            {
              action: "console.info",
              args: ["c change", "<% EVENT.detail %>"],
            },
          ],
        },
        {
          name: "d",
          value: `<% STATE.c + 1 %>`,
          track: true,
          onChange: [
            {
              action: "console.info",
              args: ["d change", "<% EVENT.detail %>"],
            },
          ],
        },
        // Note: this is a state with resolve
        {
          name: "e",
          resolve: {
            useProvider: "my-timeout-provider",
            args: [10, "<% STATE.a %>"],
          },
          track: true,
          onChange: {
            action: "console.info",
            args: ["e change", "<% EVENT.detail %>"],
          },
        },
      ],
      runtimeContext
    );
    return {
      stateStore,
    };
  };

  test("update a, then c d should update once, then later e should update once", async () => {
    consoleInfo.mockReturnValue();
    const { stateStore } = createContextStore();
    await stateStore.waitForAll();

    expect(stateStore.getValue("a")).toBe(1);
    expect(stateStore.getValue("b")).toBe(2);
    expect(stateStore.getValue("c")).toBe(3);
    expect(stateStore.getValue("d")).toBe(4);
    expect(stateStore.getValue("e")).toBe(1);

    stateStore.updateValues(
      [
        {
          name: "a",
          value: 2,
        },
      ],
      "replace",
      argsFactory
    );
    expect(consoleInfo).toBeCalledTimes(3);

    expect(consoleInfo).toHaveBeenNthCalledWith(1, "a change", 2);
    expect(consoleInfo).toHaveBeenNthCalledWith(2, "c change", 4);
    expect(consoleInfo).toHaveBeenNthCalledWith(3, "d change", 5);

    await (global as any).flushPromises();
    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });
    // `e` should only be changed after it's been resolved.
    expect(stateStore.getValue("e")).toBe(2);
    expect(consoleInfo).toBeCalledTimes(4);
    expect(consoleInfo).toHaveBeenNthCalledWith(4, "e change", 2);

    consoleInfo.mockReset();
  });
});
