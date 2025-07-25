import { jest, describe, test, expect } from "@jest/globals";
import { createProviderClass } from "@next-core/utils/general";
import { resolveData } from "./resolveData.js";
import type { RuntimeContext } from "../interfaces.js";
import { DataStore } from "./DataStore.js";
import { _internalApiGetRenderId } from "../Runtime.js";

jest.mock("../Runtime.js");

const myTimeoutProvider = jest.fn(
  (timeout: number, result?: unknown, throwError?: unknown) =>
    new Promise((resolve, reject) => {
      setTimeout(
        () => (throwError ? reject(throwError) : resolve(result)),
        timeout
      );
    })
);
customElements.define(
  "my-timeout-provider",
  createProviderClass(myTimeoutProvider)
);

const consoleWarn = jest.spyOn(console, "warn");

const mockGetRenderId = _internalApiGetRenderId as jest.Mock;

describe("resolveData", () => {
  test("general", async () => {
    const runtimeContext = {} as RuntimeContext;
    const result = await resolveData(
      {
        useProvider: "my-timeout-provider",
        args: [30, "cool"],
      },
      runtimeContext
    );
    expect(result).toEqual("cool");
  });

  test("cache", async () => {
    const ctxStore = new DataStore("CTX");
    const runtimeContext = {
      ctxStore,
    } as RuntimeContext;
    ctxStore.define(
      [
        {
          name: "current",
          value: "a",
        },
      ],
      runtimeContext
    );
    const result = await resolveData(
      {
        useProvider: "my-timeout-provider",
        args: [30, "<% CTX.current %>"],
      },
      runtimeContext
    );
    expect(result).toEqual("a");
    expect(myTimeoutProvider).toHaveBeenCalledTimes(1);

    ctxStore.updateValue("current", "b", "replace");
    const result2 = await resolveData(
      {
        useProvider: "my-timeout-provider",
        args: [30, "<% CTX.current %>"],
      },
      runtimeContext
    );
    expect(result2).toEqual("b");
    // The actual args are changed, so the cache doesn't hit.
    expect(myTimeoutProvider).toHaveBeenCalledTimes(2);

    const result3 = await resolveData(
      {
        useProvider: "my-timeout-provider",
        method: "resolve",
        args: [30, "b"],
      },
      runtimeContext
    );
    expect(result3).toEqual("b");
    // The actual args are not changed, so the cache hits.
    expect(myTimeoutProvider).toHaveBeenCalledTimes(2);
  });

  test("cache with circular data in args", async () => {
    const ctxStore = new DataStore("CTX");
    const runtimeContext = {
      ctxStore,
    } as RuntimeContext;
    const circular = { value: "Circular" } as any;
    circular.ref = circular;
    ctxStore.define(
      [
        {
          name: "current",
        },
      ],
      runtimeContext
    );
    await ctxStore.waitForAll();
    ctxStore.updateValue("current", circular, "replace");

    const result = await resolveData(
      {
        useProvider: "my-timeout-provider",
        args: [30, "<% CTX.current %>"],
      },
      runtimeContext
    );
    expect(result).toHaveProperty("value", "Circular");
    expect(myTimeoutProvider).toHaveBeenCalledTimes(1);

    const result2 = await resolveData(
      {
        useProvider: "my-timeout-provider",
        args: [30, "<% CTX.current %>"],
      },
      runtimeContext
    );
    expect(result2).toHaveProperty("value", "Circular");
    expect(myTimeoutProvider).toHaveBeenCalledTimes(1);
  });

  test("handle reject by transform", async () => {
    const runtimeContext = {} as RuntimeContext;
    const result = await resolveData(
      {
        useProvider: "my-timeout-provider",
        args: [30, null, { message: "oops" }],
        onReject: {
          transform: {
            failed: "<% DATA.message %>",
          },
        },
      },
      runtimeContext
    );
    expect(result).toEqual({ failed: "oops" });
  });

  test("fail", async () => {
    const runtimeContext = {} as RuntimeContext;
    await expect(
      resolveData(
        {
          useProvider: "my-timeout-provider",
          args: [30, null, { message: "oops" }],
        },
        runtimeContext
      )
    ).rejects.toMatchInlineSnapshot(`
      {
        "message": "oops",
      }
    `);
  });

  test("use legacy provider", async () => {
    const runtimeContext = {} as RuntimeContext;
    await expect(
      resolveData(
        {
          provider: "my\\.legacy-provider",
        } as any,
        runtimeContext
      )
    ).rejects.toMatchInlineSnapshot(
      `[Error: You're using "provider: my\\.legacy-provider" which is dropped in v3, please use "useProvider" instead]`
    );
  });

  test("use legacy field", async () => {
    consoleWarn.mockReturnValueOnce();
    const runtimeContext = {} as RuntimeContext;
    const result = await resolveData(
      {
        useProvider: "my-timeout-provider",
        args: [30, { message: "cool" }],
        field: "message",
      } as any,
      runtimeContext
    );
    expect(result).toEqual("cool");
    expect(consoleWarn).toHaveBeenCalledTimes(1);
    expect(consoleWarn).toHaveBeenCalledWith(
      expect.stringContaining("resolve.field")
    );
  });

  test("stale", async () => {
    const runtimeContext = {} as RuntimeContext;
    mockGetRenderId.mockReturnValue("render-id-2");
    const result1 = await resolveData(
      {
        useProvider: "my-timeout-provider",
        args: [30, "should-not-cache"],
      },
      runtimeContext,
      {
        renderId: "render-id-1",
      }
    );
    expect(result1).toEqual("should-not-cache");
    expect(myTimeoutProvider).toHaveBeenCalledTimes(1);

    const result2 = await resolveData(
      {
        useProvider: "my-timeout-provider",
        args: [30, "should-not-cache"],
      },
      runtimeContext,
      {
        renderId: "render-id-2",
      }
    );
    expect(result2).toEqual("should-not-cache");
    expect(myTimeoutProvider).toHaveBeenCalledTimes(2);
  });
});
