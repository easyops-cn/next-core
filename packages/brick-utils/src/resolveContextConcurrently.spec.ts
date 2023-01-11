import { ContextConf, UseProviderResolveConf } from "@next-core/brick-types";
import {
  resolveContextConcurrently,
  getDependencyMapOfContext,
  syncResolveContextConcurrently,
  deferResolveContextConcurrently,
  DeferredContext,
} from "./resolveContextConcurrently";

describe("resolveContextConcurrently", () => {
  const fnRequest = jest.fn();
  const asyncProcess = (contextConf: ContextConf): Promise<boolean> => {
    const contextResolve = contextConf.resolve as UseProviderResolveConf;
    fnRequest(contextConf.name, contextResolve.useProvider);
    return new Promise((resolve) => {
      if (contextResolve.if !== false) {
        setTimeout(() => resolve(true), contextResolve.args[0] as number);
      } else {
        resolve(false);
      }
    });
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should resolve context concurrently", async () => {
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
    resolveContextConcurrently(
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

    expect(fnRequest).toBeCalledTimes(4);
    expect(fnRequest).toHaveBeenNthCalledWith(1, "a", "willBeUnresolved");
    expect(fnRequest).toHaveBeenNthCalledWith(2, "a", "willBeResolved");
    expect(fnRequest).toHaveBeenNthCalledWith(3, "e", "willBeResolved");
    expect(fnRequest).toHaveBeenNthCalledWith(4, "x", "willBeResolved");

    jest.advanceTimersByTime(100);
    await (global as any).flushPromises();

    expect(fnRequest).toBeCalledTimes(7);
    expect(fnRequest).toHaveBeenNthCalledWith(5, "b", "willBeUnresolved");
    expect(fnRequest).toHaveBeenNthCalledWith(6, "b", "willBeResolved");
    expect(fnRequest).toHaveBeenNthCalledWith(7, "c", "willBeResolved");

    jest.advanceTimersByTime(50);
    await (global as any).flushPromises();

    expect(fnRequest).toBeCalledTimes(8);
    expect(fnRequest).toHaveBeenNthCalledWith(8, "f", "willBeResolved");

    jest.advanceTimersByTime(150);
    await (global as any).flushPromises();

    expect(fnRequest).toBeCalledTimes(9);
    expect(fnRequest).toHaveBeenNthCalledWith(9, "d", "willBeResolved");
  });

  it("should resolve context sequentially if computed CTX accesses detected", async () => {
    // Resolve in waterfall:
    //
    // ```
    // a |====>
    // b       |====>
    // c             |====>
    // ```
    resolveContextConcurrently(
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

    expect(fnRequest).toBeCalledTimes(1);
    expect(fnRequest).toHaveBeenNthCalledWith(1, "a", "willBeResolved");

    jest.advanceTimersByTime(100);
    await (global as any).flushPromises();

    expect(fnRequest).toBeCalledTimes(2);
    expect(fnRequest).toHaveBeenNthCalledWith(2, "b", "willBeResolved");

    jest.advanceTimersByTime(100);
    await (global as any).flushPromises();

    expect(fnRequest).toBeCalledTimes(3);
    expect(fnRequest).toHaveBeenNthCalledWith(3, "c", "willBeResolved");
  });

  it("should work when related contexts are all ignored", async () => {
    resolveContextConcurrently(
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
    await (global as any).flushPromises();
    expect(fnRequest).toBeCalledTimes(2);
    expect(fnRequest).toHaveBeenNthCalledWith(1, "a", "willBeUnresolved");
    expect(fnRequest).toHaveBeenNthCalledWith(2, "b", "willBeUnresolved");
  });

  it("should throw if circular CTX detected", async () => {
    expect.assertions(1);
    resolveContextConcurrently(
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
    ).catch((error) => {
      expect(error).toMatchInlineSnapshot(
        `[ReferenceError: Circular CTX detected: b, c]`
      );
    });
    jest.advanceTimersByTime(100);
    await (global as any).flushPromises();
  });

  it("should throw if duplicated context defined", async () => {
    expect.assertions(1);
    resolveContextConcurrently(
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
    ).catch((error) => {
      expect(error).toMatchInlineSnapshot(
        `[Error: Duplicated context defined: a]`
      );
    });
    jest.advanceTimersByTime(100);
    await (global as any).flushPromises();
  });
});

describe("deferResolveContextConcurrently", () => {
  const fnRequest = jest.fn();
  const asyncProcess = (contextConf: ContextConf): Promise<boolean> => {
    const contextResolve = contextConf.resolve as UseProviderResolveConf;
    if (!contextResolve) {
      return Promise.resolve(contextConf.if !== false);
    }
    return new Promise((resolve) => {
      if (contextResolve.if !== false) {
        fnRequest(contextConf.name, contextResolve.useProvider);
        setTimeout(() => resolve(true), contextResolve.args[0] as number);
      } else {
        resolve(false);
      }
    });
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should resolve context concurrently", async () => {
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
    const { pendingResult, pendingContexts } = deferResolveContextConcurrently(
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

  it("should resolve context sequentially if computed CTX accesses detected", async () => {
    // Resolve in waterfall:
    //
    // ```
    // a |====>
    // b       |====>
    // c             |====>
    // ```
    const { pendingResult, pendingContexts } = deferResolveContextConcurrently(
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

  it("should work when related contexts are all ignored", async () => {
    const { pendingResult, pendingContexts } = deferResolveContextConcurrently(
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

  it("should work when a related context is ignored", async () => {
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
          setTimeout(() => resolve(true), contextResolve.args[0] as number);
        } else {
          resolve(false);
        }
      });
    };
    const { pendingResult, pendingContexts } = deferResolveContextConcurrently(
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

    pendingContexts.get("a").then(
      () => {
        deferredPending.resolve();
      },
      (e) => {
        deferredPending.reject(e);
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

  it("should throw if circular CTX detected", async () => {
    const { pendingResult, pendingContexts } = deferResolveContextConcurrently(
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

  it("should throw if duplicated context defined", async () => {
    const { pendingResult, pendingContexts } = deferResolveContextConcurrently(
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

describe("syncResolveContextConcurrently", () => {
  const fnRequest = jest.fn();
  const syncProcess = (contextConf: ContextConf): boolean => {
    const contextResolve = contextConf.resolve as UseProviderResolveConf;
    fnRequest(contextConf.name, contextResolve.useProvider);
    return contextResolve.if !== false;
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should resolve state concurrently", async () => {
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
    syncResolveContextConcurrently(
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
            args: [100, "<% STATE.a + STATE.x %>"],
            if: false,
          },
        },
        {
          name: "b",
          resolve: {
            useProvider: "willBeResolved",
            args: [100, "<% STATE.a + 1 %>"],
          },
        },
        {
          name: "c",
          resolve: {
            useProvider: "willBeResolved",
            args: [200, "<% STATE.a + 3 %>"],
          },
        },
        {
          name: "d",
          resolve: {
            useProvider: "willBeResolved",
            args: [100, "<% STATE.b + STATE.c %>"],
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
            args: [100, "<% STATE.e + 5 %>"],
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
      syncProcess,
      "STATE"
    );

    expect(fnRequest).toBeCalledTimes(9);
    expect(fnRequest).toHaveBeenNthCalledWith(1, "a", "willBeUnresolved");
    expect(fnRequest).toHaveBeenNthCalledWith(2, "a", "willBeResolved");
    expect(fnRequest).toHaveBeenNthCalledWith(3, "b", "willBeResolved");
    expect(fnRequest).toHaveBeenNthCalledWith(4, "c", "willBeResolved");
    expect(fnRequest).toHaveBeenNthCalledWith(5, "d", "willBeResolved");
    expect(fnRequest).toHaveBeenNthCalledWith(6, "e", "willBeResolved");
    expect(fnRequest).toHaveBeenNthCalledWith(7, "f", "willBeResolved");
    expect(fnRequest).toHaveBeenNthCalledWith(8, "x", "willBeResolved");
    expect(fnRequest).toHaveBeenNthCalledWith(9, "b", "willBeUnresolved");
  });

  it("should resolve context sequentially if computed CTX accesses detected", () => {
    // Resolve in waterfall:
    //
    // ```
    // a |====>
    // b       |====>
    // c             |====>
    // ```
    syncResolveContextConcurrently(
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
      syncProcess
    );

    expect(fnRequest).toBeCalledTimes(3);
    expect(fnRequest).toHaveBeenNthCalledWith(1, "a", "willBeResolved");
    expect(fnRequest).toHaveBeenNthCalledWith(2, "b", "willBeResolved");
    expect(fnRequest).toHaveBeenNthCalledWith(3, "c", "willBeResolved");
  });

  it("should work when related contexts are all ignored", () => {
    syncResolveContextConcurrently(
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
      syncProcess
    );
    expect(fnRequest).toBeCalledTimes(2);
    expect(fnRequest).toHaveBeenNthCalledWith(1, "a", "willBeUnresolved");
    expect(fnRequest).toHaveBeenNthCalledWith(2, "b", "willBeUnresolved");
  });

  it("should throw if circular CTX detected", () => {
    expect(() => {
      syncResolveContextConcurrently(
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

        syncProcess
      );
    }).toThrowErrorMatchingInlineSnapshot(`"Circular CTX detected: b, c"`);
  });

  it("should throw if duplicated context defined", () => {
    expect(() => {
      syncResolveContextConcurrently(
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

        syncProcess
      );
    }).toThrowErrorMatchingInlineSnapshot(`"Duplicated context defined: a"`);
  });
});

describe("getDependencyMapOfContext", () => {
  it("should work", () => {
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
          property: "quality",
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
          expect.objectContaining({
            usedContexts: [],
            includesComputed: false,
          }),
        ],
        [
          expect.objectContaining({ name: "b" }),
          expect.objectContaining({
            usedContexts: ["a"],
            includesComputed: false,
          }),
        ],
        [
          expect.objectContaining({ name: "c" }),
          expect.objectContaining({
            usedContexts: ["a"],
            includesComputed: false,
          }),
        ],
        [
          expect.objectContaining({ name: "d" }),
          expect.objectContaining({
            usedContexts: ["b", "c"],
            includesComputed: false,
          }),
        ],
        [
          expect.objectContaining({ name: "e" }),
          expect.objectContaining({
            usedContexts: [],
            includesComputed: false,
          }),
        ],
        [
          expect.objectContaining({ name: "f" }),
          expect.objectContaining({
            usedContexts: ["e"],
            includesComputed: true,
          }),
        ],
        [
          expect.objectContaining({ name: "g" }),
          expect.objectContaining({
            usedContexts: ["x"],
            includesComputed: false,
          }),
        ],
        [
          expect.objectContaining({ name: "h" }),
          expect.objectContaining({
            usedContexts: ["a", "x", "b", "c"],
            includesComputed: false,
          }),
        ],
      ])
    );
  });
});
