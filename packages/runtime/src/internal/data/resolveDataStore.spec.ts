import { jest, describe, test, expect } from "@jest/globals";
import type { ContextConf, UseProviderResolveConf } from "@next-core/types";
import {
  DeferredContext,
  getDependencyMapOfContext,
  resolveDataStore,
} from "./resolveDataStore.js";

describe("resolveDataStore", () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });
  afterAll(() => {
    jest.useRealTimers();
  });

  const fnRequest = jest.fn();
  const asyncProcess = (contextConf: ContextConf): Promise<boolean> => {
    const contextResolve = contextConf.resolve as UseProviderResolveConf;
    if (!contextResolve) {
      return Promise.resolve(contextConf.if !== false);
    }
    return new Promise((resolve) => {
      if (contextResolve.if !== false) {
        fnRequest(contextConf.name, contextResolve.useProvider);
        setTimeout(() => resolve(true), contextResolve?.args?.[0] as number);
      } else {
        resolve(false);
      }
    });
  };

  test("should resolve context concurrently", async () => {
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
    const { pendingResult, pendingContexts } = resolveDataStore(
      [
        {
          name: "a",
          resolve: {
            useProvider: "willBeUnresolved",
            args: [100],
            if: false,
          },
        },
        {
          name: "a",
          resolve: {
            useProvider: "willBeResolved",
            args: [100],
          },
        },
        {
          name: "b",
          resolve: {
            useProvider: "willBeUnresolved",
            args: [100, "<% CTX.a + CTX.x %>"],
            if: false,
          },
        },
        {
          name: "b",
          resolve: {
            useProvider: "willBeResolved",
            args: [100, "<% CTX.a + 1 %>"],
          },
        },
        {
          name: "c",
          resolve: {
            useProvider: "willBeResolved",
            args: [200, "<% CTX.a + 3 %>"],
          },
        },
        {
          name: "d",
          resolve: {
            useProvider: "willBeResolved",
            args: [100, "<% CTX.b + CTX.c %>"],
          },
        },
        {
          name: "e",
          resolve: {
            useProvider: "willBeResolved",
            args: [150],
          },
        },
        {
          name: "f",
          resolve: {
            useProvider: "willBeResolved",
            args: [100, "<% CTX.e + 5 %>"],
          },
        },
        {
          name: "x",
          resolve: {
            useProvider: "willBeResolved",
            args: [50],
          },
        },
      ],
      asyncProcess
    );

    const tasks = new Map<string, boolean>([["_", false]]);
    pendingResult.then(() => {
      tasks.set("_", true);
    });
    for (const [contextName, promise] of pendingContexts) {
      tasks.set(contextName, false);
      promise.then(() => {
        tasks.set(contextName, true);
      });
    }
    const getDoneTask = (): string[] =>
      [...tasks].filter((entry) => entry[1]).map((entry) => entry[0]);

    expect(tasks).toMatchInlineSnapshot(`
      Map {
        "_" => false,
        "a" => false,
        "b" => false,
        "c" => false,
        "d" => false,
        "e" => false,
        "f" => false,
        "x" => false,
      }
    `);

    expect(fnRequest).toBeCalledTimes(3);
    expect(fnRequest).toHaveBeenNthCalledWith(1, "a", "willBeResolved");
    expect(fnRequest).toHaveBeenNthCalledWith(2, "e", "willBeResolved");
    expect(fnRequest).toHaveBeenNthCalledWith(3, "x", "willBeResolved");

    expect(getDoneTask()).toEqual([]);

    jest.advanceTimersByTime(100);
    await (global as any).flushPromises();
    expect(getDoneTask()).toEqual(["a", "x"]);

    expect(fnRequest).toBeCalledTimes(5);
    expect(fnRequest).toHaveBeenNthCalledWith(4, "b", "willBeResolved");
    expect(fnRequest).toHaveBeenNthCalledWith(5, "c", "willBeResolved");

    jest.advanceTimersByTime(50);
    await (global as any).flushPromises();
    expect(getDoneTask()).toEqual(["a", "e", "x"]);

    expect(fnRequest).toBeCalledTimes(6);
    expect(fnRequest).toHaveBeenNthCalledWith(6, "f", "willBeResolved");

    jest.advanceTimersByTime(150);
    await (global as any).flushPromises();
    expect(getDoneTask()).toEqual(["a", "b", "c", "e", "f", "x"]);

    expect(fnRequest).toBeCalledTimes(7);
    expect(fnRequest).toHaveBeenNthCalledWith(7, "d", "willBeResolved");

    jest.advanceTimersByTime(100);
    await (global as any).flushPromises();
    expect(getDoneTask()).toEqual(["_", "a", "b", "c", "d", "e", "f", "x"]);
  });

  test("should resolve context sequentially if computed CTX accesses detected", async () => {
    // Resolve in waterfall:
    //
    // ```
    // a |====>
    // b       |====>
    // c             |====>
    // ```
    const { pendingResult, pendingContexts } = resolveDataStore(
      [
        {
          name: "a",
          resolve: {
            useProvider: "willBeResolved",
            args: [100],
          },
        },
        {
          name: "b",
          resolve: {
            useProvider: "willBeResolved",
            args: [100, "<% CTX.a + 1 %>"],
          },
        },
        {
          name: "c",
          resolve: {
            useProvider: "willBeResolved",
            args: [100, "<% CTX[x] + 3 %>"],
          },
        },
      ],
      asyncProcess
    );

    const tasks = new Map<string, boolean>([["_", false]]);
    pendingResult.then(() => {
      tasks.set("_", true);
    });
    for (const [contextName, promise] of pendingContexts) {
      tasks.set(contextName, false);
      promise.then(() => {
        tasks.set(contextName, true);
      });
    }
    const getDoneTask = (): string[] =>
      [...tasks].filter((entry) => entry[1]).map((entry) => entry[0]);

    expect(tasks).toMatchInlineSnapshot(`
      Map {
        "_" => false,
        "a" => false,
        "b" => false,
        "c" => false,
      }
    `);

    expect(fnRequest).toBeCalledTimes(1);
    expect(fnRequest).toHaveBeenNthCalledWith(1, "a", "willBeResolved");

    jest.advanceTimersByTime(100);
    await (global as any).flushPromises();
    expect(getDoneTask()).toEqual(["a"]);

    expect(fnRequest).toBeCalledTimes(2);
    expect(fnRequest).toHaveBeenNthCalledWith(2, "b", "willBeResolved");

    jest.advanceTimersByTime(100);
    await (global as any).flushPromises();
    expect(getDoneTask()).toEqual(["a", "b"]);

    expect(fnRequest).toBeCalledTimes(3);
    expect(fnRequest).toHaveBeenNthCalledWith(3, "c", "willBeResolved");

    jest.advanceTimersByTime(100);
    await (global as any).flushPromises();
    expect(getDoneTask()).toEqual(["_", "a", "b", "c"]);
  });

  test("should work when related contexts are all ignored", async () => {
    const { pendingResult, pendingContexts } = resolveDataStore(
      [
        {
          name: "a",
          resolve: {
            useProvider: "willBeUnresolved",
            args: [100],
            if: false,
          },
        },
        {
          name: "b",
          resolve: {
            useProvider: "willBeUnresolved",
            args: [100, "<% CTX.a + 1 %>"],
            if: false,
          },
        },
      ],
      asyncProcess
    );

    const tasks = new Map<string, boolean>([["_", false]]);
    pendingResult.then(() => {
      tasks.set("_", true);
    });
    for (const [contextName, promise] of pendingContexts) {
      tasks.set(contextName, false);
      promise.then(() => {
        tasks.set(contextName, true);
      });
    }
    const getDoneTask = (): string[] =>
      [...tasks].filter((entry) => entry[1]).map((entry) => entry[0]);

    expect(tasks).toMatchInlineSnapshot(`
      Map {
        "_" => false,
        "a" => false,
        "b" => false,
      }
    `);

    await (global as any).flushPromises();
    expect(getDoneTask()).toEqual(["_", "a", "b"]);

    expect(fnRequest).toBeCalledTimes(0);
  });

  test("should work when a related context is ignored", async () => {
    const deferredPending: Partial<DeferredContext> = {};
    const mockWaitForUsedContext = new Promise<void>((resolve, reject) => {
      deferredPending.resolve = resolve;
      deferredPending.reject = reject;
    });
    const deferredProcess = async (
      contextConf: ContextConf
    ): Promise<boolean> => {
      const contextResolve = contextConf.resolve as UseProviderResolveConf;
      if (!contextResolve) {
        if (contextConf.if === false) {
          return false;
        }
        await mockWaitForUsedContext;
        return true;
      }
      return new Promise((resolve) => {
        if (contextResolve.if !== false) {
          fnRequest(contextConf.name, contextResolve.useProvider);
          setTimeout(() => resolve(true), contextResolve?.args?.[0] as number);
        } else {
          resolve(false);
        }
      });
    };
    const { pendingResult, pendingContexts } = resolveDataStore(
      [
        {
          name: "a",
          resolve: {
            if: false,
            useProvider: "willBeUnresolved",
            args: [100],
          },
        },
        {
          name: "b",
          value: "<% CTX.a + 1 %>",
        },
      ],
      deferredProcess
    );

    pendingContexts.get("a")!.then(
      () => {
        deferredPending.resolve!();
      },
      (e) => {
        deferredPending.reject!(e);
      }
    );

    const tasks = new Map<string, boolean>([["_", false]]);
    pendingResult.then(() => {
      tasks.set("_", true);
    });
    for (const [contextName, promise] of pendingContexts) {
      tasks.set(contextName, false);
      promise.then(() => {
        tasks.set(contextName, true);
      });
    }
    const getDoneTask = (): string[] =>
      [...tasks].filter((entry) => entry[1]).map((entry) => entry[0]);

    expect(tasks).toMatchInlineSnapshot(`
      Map {
        "_" => false,
        "a" => false,
        "b" => false,
      }
    `);

    await (global as any).flushPromises();
    expect(getDoneTask()).toEqual(["_", "a", "b"]);

    await pendingResult;
  });

  test("should throw if circular CTX detected", async () => {
    const { pendingResult, pendingContexts } = resolveDataStore(
      [
        {
          name: "a",
          resolve: {
            useProvider: "willBeResolved",
            args: [100],
          },
        },
        {
          name: "b",
          resolve: {
            useProvider: "willBeResolved",
            args: [100, "<% CTX.c + 1 %>"],
          },
        },
        {
          name: "c",
          resolve: {
            useProvider: "willBeResolved",
            args: [100, "<% CTX.b + 3 %>"],
          },
        },
      ],
      asyncProcess
    );

    const tasks = new Map<string, any>([["_", false]]);
    pendingResult
      .then(() => {
        tasks.set("_", true);
      })
      .catch((error) => {
        tasks.set("_", error);
      });
    for (const [contextName, promise] of pendingContexts) {
      tasks.set(contextName, false);
      promise
        .then(() => {
          tasks.set(contextName, true);
        })
        .catch((error) => {
          tasks.set(contextName, error);
        });
    }
    const getResolvedTask = (): string[] =>
      [...tasks].filter((entry) => entry[1] === true).map((entry) => entry[0]);
    const getRejectedTask = (): string[] =>
      [...tasks]
        .filter((entry) => typeof entry[1] !== "boolean")
        .map((entry) => entry[0]);

    expect(tasks).toMatchInlineSnapshot(`
      Map {
        "_" => false,
        "a" => false,
        "b" => false,
        "c" => false,
      }
    `);

    jest.advanceTimersByTime(100);
    await (global as any).flushPromises();
    expect(getResolvedTask()).toEqual(["a"]);
    expect(getRejectedTask()).toEqual(["_", "b", "c"]);
    expect(tasks.get("_")).toMatchInlineSnapshot(
      `[ReferenceError: Circular CTX detected: b, c]`
    );
  });

  test("should throw if duplicated context defined", async () => {
    const { pendingResult, pendingContexts } = resolveDataStore(
      [
        {
          name: "a",
          resolve: {
            useProvider: "willBeResolved",
            args: [100],
          },
        },
        {
          name: "a",
          resolve: {
            useProvider: "willBeResolved",
            args: [100],
          },
        },
      ],
      asyncProcess
    );

    const tasks = new Map<string, any>([["_", false]]);
    pendingResult
      .then(() => {
        tasks.set("_", true);
      })
      .catch((error) => {
        tasks.set("_", error);
      });
    for (const [contextName, promise] of pendingContexts) {
      tasks.set(contextName, false);
      promise
        .then(() => {
          tasks.set(contextName, true);
        })
        .catch((error) => {
          tasks.set(contextName, error);
        });
    }
    const getResolvedTask = (): string[] =>
      [...tasks].filter((entry) => entry[1] === true).map((entry) => entry[0]);
    const getRejectedTask = (): string[] =>
      [...tasks]
        .filter((entry) => typeof entry[1] !== "boolean")
        .map((entry) => entry[0]);

    expect(tasks).toMatchInlineSnapshot(`
      Map {
        "_" => false,
        "a" => false,
      }
    `);

    jest.advanceTimersByTime(100);
    await (global as any).flushPromises();
    expect(getResolvedTask()).toEqual(["a"]);
    expect(getRejectedTask()).toEqual(["_"]);
    expect(tasks.get("_")).toMatchInlineSnapshot(
      `[Error: Duplicated context defined: a]`
    );
  });
});

describe("getDependencyMapOfContext", () => {
  test("should work", () => {
    expect(
      getDependencyMapOfContext([
        {
          name: "a",
          value: 1,
        },
        {
          name: "b",
          value: "<% CTX.a + DATA.c + 1 %>",
        },
        {
          name: "c",
          resolve: {
            useProvider: "any",
            args: ["<% CTX.a + CTX.a + 3 %>"],
          },
        },
        {
          name: "d",
          resolve: {
            useProvider: "any",
            args: ["<% CTX.b + CTX.c %>"],
          },
        },
        {
          name: "e",
          value: "quality",
        },
        {
          name: "f",
          value: "<% CTX[x] + CTX['e'] %>",
        },
        {
          name: "g",
          value: "<% CTX.x %>",
        },
        {
          if: "<% CTX.a %>",
          name: "h",
          resolve: {
            useProvider: "any",
            args: ["<% CTX.b + CTX.c %>"],
          },
          value: "<% CTX.x %>",
        },
      ])
    ).toEqual(
      new Map([
        [
          expect.objectContaining({ name: "a" }),
          {
            usedProperties: new Set([]),
            hasNonStaticUsage: false,
          },
        ],
        [
          expect.objectContaining({ name: "b" }),
          {
            usedProperties: new Set(["a"]),
            hasNonStaticUsage: false,
          },
        ],
        [
          expect.objectContaining({ name: "c" }),
          {
            usedProperties: new Set(["a"]),
            hasNonStaticUsage: false,
          },
        ],
        [
          expect.objectContaining({ name: "d" }),
          {
            usedProperties: new Set(["b", "c"]),
            hasNonStaticUsage: false,
          },
        ],
        [
          expect.objectContaining({ name: "e" }),
          {
            usedProperties: new Set([]),
            hasNonStaticUsage: false,
          },
        ],
        [
          expect.objectContaining({ name: "f" }),
          {
            usedProperties: new Set(["e"]),
            hasNonStaticUsage: true,
            nonStaticUsage: "<% CTX[x] + CTX['e'] %>",
          },
        ],
        [
          expect.objectContaining({ name: "g" }),
          {
            usedProperties: new Set(["x"]),
            hasNonStaticUsage: false,
          },
        ],
        [
          expect.objectContaining({ name: "h" }),
          {
            usedProperties: new Set(["a", "x", "b", "c"]),
            hasNonStaticUsage: false,
          },
        ],
      ])
    );
  });
});
