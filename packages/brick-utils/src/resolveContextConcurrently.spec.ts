import { ContextConf, EntityResolveConf } from "@easyops/brick-types";
import {
  resolveContextConcurrently,
  getDependencyMapOfContext,
} from "./resolveContextConcurrently";

describe("resolveContextConcurrently", () => {
  const fnRequest = jest.fn();
  const asyncProcess = (contextConf: ContextConf): Promise<void> => {
    fnRequest(contextConf.name);
    return new Promise((resolve) => {
      setTimeout(
        resolve,
        (contextConf.resolve as EntityResolveConf).args[0] as number
      );
    });
  };

  afterEach(() => {
    fnRequest.mockClear();
  });

  it("should resolve context concurrently", async () => {
    // Dependency map:
    //
    // ```
    //     d
    //    ↙ ↘
    //   b   c  f
    //    ↘ ↙   ↓
    //     a    e
    // ```
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
    // ```
    resolveContextConcurrently(
      [
        {
          name: "a",
          resolve: {
            useProvider: "setTimeout",
            args: [100],
          },
        },
        {
          name: "b",
          resolve: {
            useProvider: "setTimeout",
            args: [100, "<% CTX.a + 1 %>"],
          },
        },
        {
          name: "c",
          resolve: {
            useProvider: "setTimeout",
            args: [200, "<% CTX.a + 3 %>"],
          },
        },
        {
          name: "d",
          resolve: {
            useProvider: "setTimeout",
            args: [100, "<% CTX.b + CTX.c %>"],
          },
        },
        {
          name: "e",
          resolve: {
            useProvider: "setTimeout",
            args: [150],
          },
        },
        {
          name: "f",
          resolve: {
            useProvider: "setTimeout",
            args: [100, "<% CTX.e + 5 %>"],
          },
        },
      ],
      asyncProcess
    );

    expect(fnRequest).toBeCalledTimes(2);
    expect(fnRequest).toHaveBeenNthCalledWith(1, "a");
    expect(fnRequest).toHaveBeenNthCalledWith(2, "e");

    jest.advanceTimersByTime(100);
    await (global as any).flushPromises();

    expect(fnRequest).toBeCalledTimes(4);
    expect(fnRequest).toHaveBeenNthCalledWith(3, "b");
    expect(fnRequest).toHaveBeenNthCalledWith(4, "c");

    jest.advanceTimersByTime(50);
    await (global as any).flushPromises();

    expect(fnRequest).toBeCalledTimes(5);
    expect(fnRequest).toHaveBeenNthCalledWith(5, "f");

    jest.advanceTimersByTime(150);
    await (global as any).flushPromises();

    expect(fnRequest).toBeCalledTimes(6);
    expect(fnRequest).toHaveBeenNthCalledWith(6, "d");
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
            useProvider: "setTimeout",
            args: [100],
          },
        },
        {
          name: "b",
          resolve: {
            useProvider: "setTimeout",
            args: [100, "<% CTX.a + 1 %>"],
          },
        },
        {
          name: "c",
          resolve: {
            useProvider: "setTimeout",
            args: [100, "<% CTX['x'] + 3 %>"],
          },
        },
      ],
      asyncProcess
    );

    expect(fnRequest).toBeCalledTimes(1);
    expect(fnRequest).toHaveBeenNthCalledWith(1, "a");

    jest.advanceTimersByTime(100);
    await (global as any).flushPromises();

    expect(fnRequest).toBeCalledTimes(2);
    expect(fnRequest).toHaveBeenNthCalledWith(2, "b");

    jest.advanceTimersByTime(100);
    await (global as any).flushPromises();

    expect(fnRequest).toBeCalledTimes(3);
    expect(fnRequest).toHaveBeenNthCalledWith(3, "c");
  });

  it("should throw if circular CTX detected", async () => {
    expect.assertions(1);
    resolveContextConcurrently(
      [
        {
          name: "a",
          resolve: {
            useProvider: "setTimeout",
            args: [100],
          },
        },
        {
          name: "b",
          resolve: {
            useProvider: "setTimeout",
            args: [100, "<% CTX.c + 1 %>"],
          },
        },
        {
          name: "c",
          resolve: {
            useProvider: "setTimeout",
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
          value: "<% CTX['x'] + CTX.e %>",
        },
        {
          name: "g",
          value: "<% CTX.x %>",
        },
      ])
    ).toEqual(
      new Map([
        [
          "a",
          expect.objectContaining({
            dependencies: [],
            includesComputed: false,
          }),
        ],
        [
          "b",
          expect.objectContaining({
            dependencies: ["a"],
            includesComputed: false,
          }),
        ],
        [
          "c",
          expect.objectContaining({
            dependencies: ["a"],
            includesComputed: false,
          }),
        ],
        [
          "d",
          expect.objectContaining({
            dependencies: ["b", "c"],
            includesComputed: false,
          }),
        ],
        [
          "e",
          expect.objectContaining({
            dependencies: [],
            includesComputed: false,
          }),
        ],
        [
          "f",
          expect.objectContaining({
            dependencies: ["e"],
            includesComputed: true,
          }),
        ],
        [
          "g",
          expect.objectContaining({
            dependencies: ["x"],
            includesComputed: false,
          }),
        ],
      ])
    );
  });
});
