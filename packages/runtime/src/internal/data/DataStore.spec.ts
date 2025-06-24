import { jest, describe, test, expect, afterEach } from "@jest/globals";
import { createProviderClass } from "@next-core/utils/general";
import { BatchUpdateContextItem } from "@next-core/types";
import type { RuntimeContext } from "../interfaces.js";
import { DataStore } from "./DataStore.js";
import { clearResolveCache } from "./resolveData.js";
import { handleHttpError } from "../../handleHttpError.js";
import { _internalApiGetRenderId } from "../Runtime.js";
import { RendererContext } from "../RendererContext.js";
import {
  callRealTimeDataInspectHooks,
  setRealTimeDataInspectRoot,
} from "./realTimeDataInspect.js";

jest.mock("../../handleHttpError.js");
jest.mock("../Runtime.js");
jest.mock("./realTimeDataInspect.js", () => {
  let realTimeDataInspectRoot: any;
  return {
    get realTimeDataInspectRoot() {
      return realTimeDataInspectRoot;
    },
    setRealTimeDataInspectRoot(root: any) {
      realTimeDataInspectRoot = root;
    },
    callRealTimeDataInspectHooks: jest.fn(),
  };
});

const consoleWarn = jest.spyOn(console, "warn");
const consoleInfo = jest.spyOn(console, "info");

const mockGetRenderId = _internalApiGetRenderId as jest.Mock;

const mockCallRealTimeDataInspectHooks =
  callRealTimeDataInspectHooks as jest.Mock;

const myTimeoutProvider = jest.fn(
  (timeout: number, result?: string, error?: unknown) =>
    new Promise((resolve, reject) => {
      setTimeout(() => (error ? reject(error) : resolve(result)), timeout);
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
    };
  };

  beforeAll(() => {
    // Sometimes `waitFor` will be stuck and multi macro tasks will be executed
    // in a batch, so we set a retry.
    jest.retryTimes(2, {
      logErrorsBeforeRetry: true,
    });
  });

  afterAll(() => {
    jest.retryTimes(0);
  });

  test("Resolve sequence", async () => {
    jest.useFakeTimers();
    const { ctxStore } = createContextStore();
    expect(ctxStore.getAllValues()).toEqual({});

    await (global as any).flushPromises();
    jest.advanceTimersByTime(50);
    await (global as any).flushPromises();
    expect(ctxStore.getAllValues()).toEqual({
      x: "X",
    });

    jest.advanceTimersByTime(50);
    await (global as any).flushPromises();
    expect(ctxStore.getAllValues()).toEqual({
      a: "A",
      x: "X",
    });

    jest.advanceTimersByTime(50);
    await (global as any).flushPromises();
    expect(ctxStore.getAllValues()).toEqual({
      a: "A",
      e: "E",
      x: "X",
    });

    jest.advanceTimersByTime(50);
    await (global as any).flushPromises();
    expect(ctxStore.getAllValues()).toEqual({
      a: "A",
      b: "B:A,1",
      e: "E",
      x: "X",
    });

    jest.advanceTimersByTime(50);
    await (global as any).flushPromises();
    expect(ctxStore.getAllValues()).toEqual({
      a: "A",
      b: "B:A,1",
      e: "E",
      f: "F:E,5",
      x: "X",
    });

    jest.advanceTimersByTime(50);
    await (global as any).flushPromises();
    expect(ctxStore.getAllValues()).toEqual({
      a: "A",
      b: "B:A,1",
      c: "C:A,3",
      e: "E",
      f: "F:E,5",
      x: "X",
    });

    jest.advanceTimersByTime(100);
    await (global as any).flushPromises();
    expect(ctxStore.getAllValues()).toEqual({
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
    const { ctxStore } = createContextStore();
    expect(ctxStore.getAllValues()).toEqual({});

    await ctxStore.waitFor(["x"]);
    expect(ctxStore.getAllValues()).toEqual({
      x: "X",
    });

    await ctxStore.waitFor(["a"]);
    expect(ctxStore.getAllValues()).toEqual({
      a: "A",
      x: "X",
    });

    await ctxStore.waitFor(["e"]);
    expect(ctxStore.getAllValues()).toEqual({
      a: "A",
      e: "E",
      x: "X",
    });

    await ctxStore.waitFor(["b"]);
    expect(ctxStore.getAllValues()).toEqual({
      a: "A",
      b: "B:A,1",
      e: "E",
      x: "X",
    });

    await ctxStore.waitFor(["f"]);
    expect(ctxStore.getAllValues()).toEqual({
      a: "A",
      b: "B:A,1",
      e: "E",
      f: "F:E,5",
      x: "X",
    });

    await ctxStore.waitFor(["c"]);
    expect(ctxStore.getAllValues()).toEqual({
      a: "A",
      b: "B:A,1",
      c: "C:A,3",
      e: "E",
      f: "F:E,5",
      x: "X",
    });

    await ctxStore.waitFor(["d"]);
    expect(ctxStore.getAllValues()).toEqual({
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
    const { ctxStore } = createContextStore();
    expect(ctxStore.getAllValues()).toEqual({});
    await ctxStore.waitForAll();
    expect(ctxStore.getAllValues()).toEqual({
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
  beforeEach(() => {
    setRealTimeDataInspectRoot(undefined!);
  });

  test("context.assign", async () => {
    setRealTimeDataInspectRoot({});
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

    expect(consoleWarn).not.toHaveBeenCalled();
    consoleWarn.mockReturnValueOnce();
    ctxStore.updateValue("primitive", { amount: 42 }, "assign");
    expect(ctxStore.getValue("primitive")).toEqual({ amount: 42 });
    expect(consoleWarn).toHaveBeenCalledTimes(1);
    expect(consoleWarn).toHaveBeenCalledWith(
      expect.stringContaining("Non-object")
    );

    expect(mockCallRealTimeDataInspectHooks).toHaveBeenCalledTimes(2);
  });

  test("state and onChange", async () => {
    jest.useFakeTimers();
    const tplStateStoreId = "tpl-state-1";
    setRealTimeDataInspectRoot({ tplStateStoreId });
    const tplStateStoreMap = new Map<string, DataStore<"STATE">>();
    const runtimeContext = {
      tplStateStoreId,
      tplStateStoreMap,
    } as Partial<RuntimeContext> as RuntimeContext;
    const stateStore = new DataStore(
      "STATE",
      undefined,
      undefined,
      tplStateStoreId
    );
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
        {
          name: "e",
          value: -1,
          expose: true,
        },
      ],
      runtimeContext,
      [
        ["b", Promise.resolve(7)],
        ["c", Promise.resolve(undefined), true],
        ["c", Promise.resolve(8), true],
        ["d", Promise.resolve(9)],
        ["e", new Promise((resolve) => setTimeout(() => resolve(10), 100))],
      ]
    );
    await (global as any).flushPromises();
    expect(stateStore.getValue("a")).toBe(1);
    expect(stateStore.getValue("b")).toBe(0);
    expect(stateStore.getValue("c")).toBe(8);
    expect(stateStore.getValue("d")).toBe(undefined);
    expect(stateStore.getValue("e")).toBe(undefined);
    jest.advanceTimersByTime(100);
    jest.useRealTimers();

    await stateStore.waitForAll();
    expect(stateStore.getValue("e")).toBe(10);

    stateStore.updateValue("a", 2, "replace");
    expect(stateStore.getValue("a")).toBe(2);
    expect(stateStore.getValue("b")).toBe(42);

    expect(mockCallRealTimeDataInspectHooks).toHaveBeenCalledTimes(2);
    expect(mockCallRealTimeDataInspectHooks).toHaveBeenNthCalledWith(1, {
      changeType: "update",
      tplStateStoreId,
      detail: {
        name: "b",
        value: 42,
      },
    });
    expect(mockCallRealTimeDataInspectHooks).toHaveBeenNthCalledWith(2, {
      changeType: "update",
      tplStateStoreId,
      detail: {
        name: "a",
        value: 2,
      },
    });
  });

  test("lazy/async, load and track", async () => {
    setRealTimeDataInspectRoot({
      tplStateStoreId: "tpl-state-999",
    });
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
    expect(myTimeoutProvider).toHaveBeenCalledTimes(1);

    ctxStore.mountAsyncData();
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
    expect(myTimeoutProvider).toHaveBeenCalledTimes(2);
    expect(consoleInfo).not.toHaveBeenCalled();
    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });
    expect(ctxStore.getValue("lazyValue")).toBe("lazily updated");
    expect(ctxStore.getValue("processedData")).toBe(
      "processed: lazily updated"
    );

    expect(consoleInfo).toHaveBeenCalledTimes(4);
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
    expect(myTimeoutProvider).toHaveBeenCalledTimes(2);
    expect(consoleInfo).toHaveBeenCalledTimes(6);
    expect(consoleInfo).toHaveBeenNthCalledWith(5, "[3] success", {
      value: "lazily updated",
    });
    expect(consoleInfo).toHaveBeenNthCalledWith(6, "[3] finally", null);

    consoleInfo.mockReset();
  });

  test("track conditional resolve (initial with fallback)", async () => {
    const ctxStore = new DataStore("CTX");
    const runtimeContext = {
      ctxStore,
    } as Partial<RuntimeContext> as RuntimeContext;
    ctxStore.define(
      [
        {
          name: "remote",
          value: false,
        },
        {
          name: "fallback",
          value: "from fallback",
        },
        {
          name: "conditionalValue",
          resolve: {
            if: "<% CTX.remote %>",
            useProvider: "my-timeout-provider",
            args: [1, "from remote"],
          },
          value: "<% CTX.fallback %>",
          track: true,
        },
      ],
      runtimeContext
    );
    await ctxStore.waitForAll();
    expect(ctxStore.getValue("conditionalValue")).toBe("from fallback");
    expect(myTimeoutProvider).not.toHaveBeenCalled();

    ctxStore.updateValue("fallback", "fallback updated", "replace");
    expect(ctxStore.getValue("conditionalValue")).toBe("fallback updated");

    ctxStore.updateValue("remote", true, "replace");
    await (global as any).flushPromises();
    expect(myTimeoutProvider).toHaveBeenCalledTimes(1);
    await new Promise((resolve) => {
      setTimeout(resolve, 1);
    });

    // Updating deps of fallback value after the data has switched to using
    // resolve, will be ignored.
    ctxStore.updateValue("fallback", "fallback updated again", "replace");
    expect(ctxStore.getValue("conditionalValue")).toBe("from remote");
  });

  test("track conditional resolve (initial with resolve)", async () => {
    const ctxStore = new DataStore("CTX");
    const runtimeContext = {
      ctxStore,
    } as Partial<RuntimeContext> as RuntimeContext;
    ctxStore.define(
      [
        {
          name: "remote",
          value: true,
        },
        {
          name: "fallback",
          value: "from fallback",
        },
        {
          name: "conditionalValue",
          resolve: {
            if: "<% CTX.remote %>",
            useProvider: "my-timeout-provider",
            args: [1, "from remote"],
          },
          value: "<% CTX.fallback %>",
          track: true,
        },
      ],
      runtimeContext
    );
    await ctxStore.waitForAll();
    expect(ctxStore.getValue("conditionalValue")).toBe("from remote");
    expect(myTimeoutProvider).toHaveBeenCalledTimes(1);

    ctxStore.updateValue("fallback", "fallback updated", "replace");
    expect(ctxStore.getValue("conditionalValue")).toBe("from remote");

    ctxStore.updateValue("remote", false, "replace");
    expect(ctxStore.getValue("conditionalValue")).toBe("fallback updated");

    // Await and make sure resolve is ignored.
    await (global as any).flushPromises();
    expect(myTimeoutProvider).toHaveBeenCalledTimes(1);
    await new Promise((resolve) => {
      setTimeout(resolve, 1);
    });
    expect(ctxStore.getValue("conditionalValue")).toBe("fallback updated");

    ctxStore.updateValue("fallback", "fallback updated again", "replace");
    expect(ctxStore.getValue("conditionalValue")).toBe(
      "fallback updated again"
    );

    // Resume remote again.
    ctxStore.updateValue("remote", true, "replace");
    await (global as any).flushPromises();
    expect(myTimeoutProvider).toHaveBeenCalledTimes(1);
    await new Promise((resolve) => {
      setTimeout(resolve, 1);
    });
    expect(ctxStore.getValue("conditionalValue")).toBe("from remote");
  });

  test("error handling", async () => {
    consoleInfo.mockReturnValue();
    const ctxStore = new DataStore("CTX");
    const runtimeContext = {
      ctxStore,
    } as Partial<RuntimeContext> as RuntimeContext;
    ctxStore.define(
      [
        {
          name: "willFail",
          resolve: {
            useProvider: "my-timeout-provider",
            args: [10, null, "oops"],
            lazy: true,
          },
          value: "initial",
        },
        {
          name: "willFail2",
          resolve: {
            useProvider: "my-timeout-provider",
            args: [10, null, "oops-2"],
            lazy: true,
          },
          value: "initial-2",
        },
      ],
      runtimeContext
    );
    await ctxStore.waitForAll();
    ctxStore.updateValue("willFail", undefined, "load", {
      error: {
        action: "console.info",
        args: ["error", "<% EVENT.detail %>"],
      },
      finally: {
        action: "console.info",
        args: ["finally", "<% EVENT.detail %>"],
      },
    });
    await (global as any).flushPromises();
    await new Promise((resolve) => {
      setTimeout(resolve, 10);
    });

    expect(consoleInfo).toHaveBeenCalledTimes(2);
    expect(handleHttpError).not.toHaveBeenCalled();

    ctxStore.updateValue("willFail2", undefined, "load", {
      finally: {
        action: "console.info",
        args: ["finally", "<% EVENT.detail %>"],
      },
    });
    await (global as any).flushPromises();
    await new Promise((resolve) => {
      setTimeout(resolve, 10);
    });

    expect(consoleInfo).toHaveBeenCalledTimes(3);
    expect(handleHttpError).toHaveBeenCalledTimes(1);

    consoleInfo.mockReset();
  });

  test("dismiss flow api not found", async () => {
    const rendererContext = new RendererContext("page", {
      renderId: "render-id-1",
    });
    mockGetRenderId.mockReturnValue("render-id-2");
    const ctxStore = new DataStore("CTX", undefined, rendererContext);
    const runtimeContext = {
      ctxStore,
    } as Partial<RuntimeContext> as RuntimeContext;
    ctxStore.define(
      [
        {
          name: "willFail",
          resolve: {
            useProvider: "my-timeout-provider",
            args: [10, null, '<% { name: "FlowApiNotFoundError" } %>'],
            lazy: true,
          },
          value: "initial",
        },
      ],
      runtimeContext
    );
    await ctxStore.waitForAll();
    ctxStore.updateValue("willFail", undefined, "load");
    await (global as any).flushPromises();
    await new Promise((resolve) => {
      setTimeout(resolve, 10);
    });

    expect(handleHttpError).not.toHaveBeenCalled();
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
      `"You can not load "CTX.a" which is not using resolve"`
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
    expect(consoleInfo).toHaveBeenCalledTimes(3);

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
    expect(consoleInfo).toHaveBeenCalledTimes(4);

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
    expect(consoleInfo).toHaveBeenCalledTimes(3);

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
    expect(consoleInfo).toHaveBeenCalledTimes(3);

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
    expect(consoleInfo).toHaveBeenCalledTimes(4);

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
    expect(consoleInfo).toHaveBeenCalledTimes(2);

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
    expect(consoleInfo).toHaveBeenCalledTimes(2);

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
    expect(consoleInfo).toHaveBeenCalledTimes(3);

    expect(consoleInfo).toHaveBeenNthCalledWith(1, "a change", 2);
    expect(consoleInfo).toHaveBeenNthCalledWith(2, "c change", 4);
    expect(consoleInfo).toHaveBeenNthCalledWith(3, "d change", 5);

    await (global as any).flushPromises();
    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });
    // `e` should only be changed after it's been resolved.
    expect(stateStore.getValue("e")).toBe(2);
    expect(consoleInfo).toHaveBeenCalledTimes(4);
    expect(consoleInfo).toHaveBeenNthCalledWith(4, "e change", 2);

    consoleInfo.mockReset();
  });
});
