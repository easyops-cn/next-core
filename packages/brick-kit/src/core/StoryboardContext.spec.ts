import {
  BatchUpdateContextItem,
  ResolveOptions,
  RuntimeBrickElement,
} from "@next-core/brick-types";
import { CustomTemplateContext } from "./CustomTemplates/CustomTemplateContext";
import { StoryboardContextWrapper } from "./StoryboardContext";
import * as runtime from "./Runtime";
import { CustomFormContext } from "./CustomForms/CustomFormContext";

describe("StoryboardContextWrapper", () => {
  const consoleWarn = jest.spyOn(console, "warn").mockImplementation();
  const consoleInfo = jest.spyOn(console, "info").mockImplementation();

  let resolveValue: string;
  let rejectReason: Error;
  const resolveOne = jest.fn(
    async (
      type: unknown,
      resolveConf: unknown,
      conf: Record<string, unknown>,
      brick?: unknown,
      context?: unknown,
      options?: ResolveOptions
    ) => {
      if (rejectReason) {
        throw rejectReason;
      }
      await Promise.resolve();
      conf.value = `[cache:${options?.cache ?? "default"}] ${resolveValue}`;
    }
  );

  beforeEach(() => {
    resolveValue = "lazily updated";
    rejectReason = undefined;
    jest.spyOn(runtime, "_internalApiGetResolver").mockReturnValue({
      resolveOne,
    } as any);
    jest.clearAllMocks();
  });

  it("should work", () => {
    const tplContext = new CustomTemplateContext({});
    const ctx = tplContext.state;
    ctx.syncDefine(
      [
        {
          name: "depends",
          value: "<% `depends:${STATE.quality}` %>",
        },
        {
          name: "quality",
          value: "good",
        },
        {
          name: "state",
          value: "initial",
        },
        {
          name: "ignored",
          if: false,
          value: "oops",
        },
      ],
      {} as any,
      {
        properties: {
          state: "updated",
        },
      }
    );
    expect(ctx.getValue("quality")).toBe("good");
    expect(ctx.getValue("state")).toBe("updated");
    expect(ctx.getValue("ignored")).toBe(undefined);
    expect(ctx.getValue("depends")).toBe("depends:good");
  });

  it("should refresh", async () => {
    const brick = { properties: {} };
    const tplContext = new CustomTemplateContext(brick);
    const ctx = tplContext.state;
    await ctx.define(
      [
        {
          name: "asyncValue",
          resolve: {
            useProvider: "my-provider",
            lazy: true,
          },
          value: "initial",
        },
        {
          name: "processedData",
          value: "<% `processed: ${STATE.asyncValue}` %>",
          track: true,
        },
      ],
      {
        tplContextId: tplContext.id,
      } as any,
      brick
    );

    expect(ctx.getValue("asyncValue")).toBe("initial");
    expect(ctx.getValue("processedData")).toBe("processed: initial");
    ctx.updateValue("asyncValue", undefined, "refresh", {
      success: {
        action: "console.info",
        args: ["success", "<% EVENT.detail %>"],
      },
      error: {
        action: "console.info",
        args: ["error", "<% EVENT.detail.message %>"],
      },
      finally: {
        action: "console.info",
        args: ["finally", "<% EVENT.detail %>"],
      },
    });
    expect(ctx.getValue("asyncValue")).toBe("initial");
    expect(consoleInfo).not.toBeCalled();

    await (global as any).flushPromises();
    expect(ctx.getValue("asyncValue")).toBe("[cache:reload] lazily updated");
    expect(ctx.getValue("processedData")).toBe(
      "processed: [cache:reload] lazily updated"
    );
    expect(consoleInfo).toBeCalledTimes(2);
    expect(consoleInfo).toHaveBeenNthCalledWith(1, "success", {
      value: "[cache:reload] lazily updated",
    });
    expect(consoleInfo).toHaveBeenNthCalledWith(2, "finally", null);
  });

  it("should handle error when load failed", async () => {
    const brick = { properties: {} };
    const tplContext = new CustomTemplateContext(brick);
    const ctx = tplContext.state;
    await ctx.define(
      [
        {
          name: "asyncValue",
          resolve: {
            useProvider: "my-provider",
            lazy: true,
          },
          value: "initial",
        },
      ],
      {
        tplContextId: tplContext.id,
      } as any,
      brick
    );

    rejectReason = new Error("oops");
    ctx.updateValue("asyncValue", undefined, "load", {
      success: {
        action: "console.info",
        args: ["success", "<% EVENT.detail %>"],
      },
      error: {
        action: "console.info",
        args: ["error", "<% EVENT.detail.message %>"],
      },
      finally: {
        action: "console.info",
        args: ["finally", "<% EVENT.detail %>"],
      },
    });

    expect(ctx.getValue("asyncValue")).toBe("initial");
    expect(consoleInfo).not.toBeCalled();

    await (global as any).flushPromises();
    expect(ctx.getValue("asyncValue")).toBe("initial");
    expect(consoleInfo).toBeCalledTimes(2);
    expect(consoleInfo).toHaveBeenNthCalledWith(1, "error", "oops");
    expect(consoleInfo).toHaveBeenNthCalledWith(2, "finally", null);
  });

  it("should refresh when deps updated", async () => {
    const brick = { properties: {} };
    const tplContext = new CustomTemplateContext(brick);
    const ctx = tplContext.state;

    resolveValue = "initial";

    await ctx.define(
      [
        {
          name: "asyncValue",
          resolve: {
            useProvider: "my-provider",
            args: ["<% STATE.dep %>"],
          },
          track: true,
        },
        {
          name: "dep",
          value: "first",
        },
      ],
      {
        tplContextId: tplContext.id,
      } as any,
      brick
    );

    expect(ctx.getValue("asyncValue")).toBe("[cache:default] initial");
    expect(ctx.getValue("dep")).toBe("first");

    resolveValue = "lazily updated";
    ctx.updateValue("dep", "second", "replace");
    expect(ctx.getValue("dep")).toBe("second");
    expect(ctx.getValue("asyncValue")).toBe("[cache:default] initial");

    await (global as any).flushPromises();
    expect(ctx.getValue("asyncValue")).toBe("[cache:default] lazily updated");
  });

  it("should track conditional resolve (initial with fallback)", async () => {
    const brick = { properties: {} };
    const tplContext = new CustomTemplateContext(brick);
    const ctx = tplContext.state;

    resolveValue = "initial";

    await ctx.define(
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
            if: "<% STATE.remote %>",
            useProvider: "my-provider",
            args: ["from remote"],
          },
          value: "<% STATE.fallback %>",
          track: true,
        },
      ],
      {
        tplContextId: tplContext.id,
      } as any,
      brick
    );

    expect(ctx.getValue("conditionalValue")).toBe("from fallback");

    ctx.updateValue("fallback", "fallback updated", "replace");
    expect(ctx.getValue("conditionalValue")).toBe("fallback updated");

    ctx.updateValue("remote", true, "replace");
    await (global as any).flushPromises();
    expect(ctx.getValue("conditionalValue")).toBe("[cache:default] initial");

    // Updating deps of fallback value after the data has switched to using
    // resolve, will be ignored.
    ctx.updateValue("fallback", "fallback updated again", "replace");
    expect(ctx.getValue("conditionalValue")).toBe("[cache:default] initial");
  });

  it("should track conditional resolve (initial with resolve)", async () => {
    const brick = { properties: {} };
    const tplContext = new CustomTemplateContext(brick);
    const ctx = tplContext.state;

    resolveValue = "initial";

    await ctx.define(
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
            if: "<% STATE.remote %>",
            useProvider: "my-provider",
            args: ["from remote"],
          },
          value: "<% STATE.fallback %>",
          track: true,
        },
      ],
      {
        tplContextId: tplContext.id,
      } as any,
      brick
    );

    expect(ctx.getValue("conditionalValue")).toBe("[cache:default] initial");

    ctx.updateValue("fallback", "fallback updated", "replace");
    expect(ctx.getValue("conditionalValue")).toBe("[cache:default] initial");

    ctx.updateValue("remote", false, "replace");
    expect(ctx.getValue("conditionalValue")).toBe("fallback updated");

    // Await and make sure resolve is ignored.
    await (global as any).flushPromises();
    expect(ctx.getValue("conditionalValue")).toBe("fallback updated");

    ctx.updateValue("fallback", "fallback updated again", "replace");
    expect(ctx.getValue("conditionalValue")).toBe("fallback updated again");
  });

  it("should load", async () => {
    const brick = { properties: {} };
    const tplContext = new CustomTemplateContext(brick);
    const ctx = tplContext.state;
    await ctx.define(
      [
        {
          name: "lazyValue",
          resolve: {
            useProvider: "my-provider",
            lazy: true,
          },
          value: "initial",
        },
        {
          name: "processedData",
          value: "<% `processed: ${STATE.lazyValue}` %>",
          track: true,
        },
      ],
      {
        tplContextId: tplContext.id,
      } as any,
      brick
    );

    expect(ctx.getValue("lazyValue")).toBe("initial");
    expect(ctx.getValue("processedData")).toBe("processed: initial");
    // Trigger load twice.
    ctx.updateValue("lazyValue", undefined, "load", {
      success: {
        action: "console.info",
        args: ["[1] success", "<% EVENT.detail %>"],
      },
      finally: {
        action: "console.info",
        args: ["[1] finally", "<% EVENT.detail %>"],
      },
    });
    ctx.updateValue("lazyValue", undefined, "load", {
      success: {
        action: "console.info",
        args: ["[2] success", "<% EVENT.detail %>"],
      },
      finally: {
        action: "console.info",
        args: ["[2] finally", "<% EVENT.detail %>"],
      },
    });
    expect(ctx.getValue("lazyValue")).toBe("initial");
    expect(consoleInfo).not.toBeCalled();

    await (global as any).flushPromises();
    // Will not load again if it is already LOADING.
    expect(resolveOne).toBeCalledTimes(1);
    expect(ctx.getValue("lazyValue")).toBe("[cache:default] lazily updated");
    expect(ctx.getValue("processedData")).toBe(
      "processed: [cache:default] lazily updated"
    );
    expect(consoleInfo).toBeCalledTimes(4);
    expect(consoleInfo).toHaveBeenNthCalledWith(1, "[1] success", {
      value: "[cache:default] lazily updated",
    });
    expect(consoleInfo).toHaveBeenNthCalledWith(2, "[1] finally", null);
    expect(consoleInfo).toHaveBeenNthCalledWith(3, "[2] success", {
      value: "[cache:default] lazily updated",
    });
    expect(consoleInfo).toHaveBeenNthCalledWith(4, "[2] finally", null);

    ctx.updateValue("lazyValue", undefined, "load", {
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
    expect(resolveOne).toBeCalledTimes(1);
    expect(consoleInfo).toBeCalledTimes(6);
    expect(consoleInfo).toHaveBeenNthCalledWith(5, "[3] success", {
      value: "[cache:default] lazily updated",
    });
    expect(consoleInfo).toHaveBeenNthCalledWith(6, "[3] finally", null);
  });

  it("should handle async", async () => {
    const brick = { properties: {} };
    const ctx = new StoryboardContextWrapper();
    await ctx.define(
      [
        {
          name: "lazyValue",
          resolve: {
            useProvider: "my-provider",
            lazy: true,
          },
          value: "initial",
        },
        {
          name: "asyncValue",
          resolve: {
            useProvider: "my-provider",
            async: true,
          },
          value: "async initial",
        },
      ],
      {} as any,
      brick
    );

    expect(ctx.getValue("lazyValue")).toBe("initial");
    expect(ctx.getValue("asyncValue")).toBe("async initial");

    expect(resolveOne).toBeCalledTimes(1);

    ctx.handleAsyncAfterMount();
    await (global as any).flushPromises();
    expect(ctx.getValue("asyncValue")).toBe("[cache:default] lazily updated");

    // Trigger load twice.
    ctx.updateValue("lazyValue", undefined, "load", {
      success: {
        action: "console.info",
        args: ["[1] success", "<% EVENT.detail %>"],
      },
      finally: {
        action: "console.info",
        args: ["[1] finally", "<% EVENT.detail %>"],
      },
    });
    ctx.updateValue("lazyValue", undefined, "load", {
      success: {
        action: "console.info",
        args: ["[2] success", "<% EVENT.detail %>"],
      },
      finally: {
        action: "console.info",
        args: ["[2] finally", "<% EVENT.detail %>"],
      },
    });
    expect(ctx.getValue("lazyValue")).toBe("initial");
    expect(consoleInfo).not.toBeCalled();

    await (global as any).flushPromises();
    // Will not load again if it is already LOADING.
    expect(resolveOne).toBeCalledTimes(2);
    expect(ctx.getValue("lazyValue")).toBe("[cache:default] lazily updated");
    expect(consoleInfo).toBeCalledTimes(4);
    expect(consoleInfo).toHaveBeenNthCalledWith(1, "[1] success", {
      value: "[cache:default] lazily updated",
    });
    expect(consoleInfo).toHaveBeenNthCalledWith(2, "[1] finally", null);
    expect(consoleInfo).toHaveBeenNthCalledWith(3, "[2] success", {
      value: "[cache:default] lazily updated",
    });
    expect(consoleInfo).toHaveBeenNthCalledWith(4, "[2] finally", null);

    ctx.updateValue("lazyValue", undefined, "load", {
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
    expect(resolveOne).toBeCalledTimes(2);
    expect(consoleInfo).toBeCalledTimes(6);
    expect(consoleInfo).toHaveBeenNthCalledWith(5, "[3] success", {
      value: "[cache:default] lazily updated",
    });
    expect(consoleInfo).toHaveBeenNthCalledWith(6, "[3] finally", null);
  });

  it("should throw if use resolve with syncDefine", () => {
    const ctx = new StoryboardContextWrapper("tpl-ctx-1");
    expect(() => {
      ctx.syncDefine(
        [
          {
            name: "quality",
            resolve: {
              useProvider: "my-provider",
            },
          },
        ],
        {} as any,
        {}
      );
    }).toThrowErrorMatchingInlineSnapshot(`"resolve is not allowed here"`);
  });

  it("should warn when re-setting with the same name", () => {
    const ctx = new StoryboardContextWrapper();
    ctx.set("any", {
      type: "free-variable",
      value: "yes",
    });
    ctx.set("any", {
      type: "brick-property",
      brick: {
        element: {
          myProp: "good",
        } as any,
      },
      prop: "myProp",
    });
    expect(consoleWarn).toHaveBeenCalledTimes(1);
    expect(consoleWarn).toBeCalledWith(
      expect.stringContaining("already existed")
    );
    expect(ctx.get().get("any")).toEqual({
      type: "brick-property",
      brick: {
        element: {
          myProp: "good",
        } as any,
      },
      prop: "myProp",
    });
  });

  it("should listen on state.change", async () => {
    const brick = {
      element: document.createElement("div") as RuntimeBrickElement,
    };
    const refElement = document.createElement("span");
    brick.element.$$getElementByRef = () => refElement;
    const tplContext = new CustomTemplateContext(brick);
    await tplContext.state.define(
      [
        {
          name: "quality",
          value: "good",
          onChange: {
            targetRef: "any",
            properties: {
              title: "updated",
            },
          },
        },
      ],
      {} as any,
      brick
    );
    tplContext.state.updateValue("quality", "better", "replace");
    expect(refElement.title).toBe("updated");
  });

  it("should throw if trying to update undefined state", () => {
    const ctx = new StoryboardContextWrapper("tpl-ctx-1");
    expect(() => {
      ctx.updateValue("notExisted", "oops", "replace");
    }).toThrowErrorMatchingInlineSnapshot(`"State not found: notExisted"`);
  });

  it("formstate should change", async () => {
    const brick = {
      properties: {},
    };
    const formContext = new CustomFormContext();
    await formContext.formState.define(
      [
        {
          name: "quality",
          value: "good",
          onChange: {
            targetRef: "any",
            properties: {
              title: "updated",
            },
          },
        },
      ],
      {} as any,
      brick
    );
    formContext.formState.updateValue("quality", "better", "replace");
    expect(formContext.formState.getValue("quality")).toBe("better");
  });
});

describe("deferDefine", () => {
  const fnRequest = jest.fn();
  let ctx: StoryboardContextWrapper;

  beforeEach(() => {
    ctx = new StoryboardContextWrapper();
    const resolveOne = jest.fn(
      async (
        type: unknown,
        resolveConf: any,
        valueConf: { value: unknown }
      ) => {
        await ctx.waitForUsedContext(resolveConf);
        fnRequest(resolveConf.useProvider);
        return new Promise<void>((resolve) => {
          setTimeout(() => {
            valueConf.value = resolveConf.args[0];
            resolve();
          }, resolveConf.args[1]);
        });
      }
    );
    jest.spyOn(runtime, "_internalApiGetResolver").mockReturnValue({
      resolveOne,
    } as any);
    jest.spyOn(runtime, "_internalApiGetCurrentContext").mockReturnValue({
      storyboardContext: ctx.get(),
    });
    jest.clearAllMocks();
  });

  it("should work for nested deferDefine", async () => {
    const getDataEntries = (): unknown =>
      [...ctx.get().entries()].map(([k, v]) => [k, (v as any).value]);

    ctx.deferDefine(
      [
        {
          name: "a",
          value: "result-a",
        },
        {
          name: "b",
          resolve: {
            useProvider: "my-provider-b",
            args: ["result-b", 100, "<% CTX.c %>"],
          },
          value: "initial",
        },
        {
          name: "c",
          resolve: {
            useProvider: "my-provider-c",
            args: ["result-c", 50, "<% CTX.a %>"],
          },
        },
      ],
      {} as any
    );

    ctx.deferDefine(
      [
        {
          name: "d",
          resolve: {
            useProvider: "my-provider-d",
            args: ["result-d", 30, "<% CTX.c %>"],
          },
        },
      ],
      {} as any
    );

    expect(fnRequest).toBeCalledTimes(0);
    expect(getDataEntries()).toEqual([]);

    await (global as any).flushPromises();
    expect(getDataEntries()).toEqual([["a", "result-a"]]);

    expect(fnRequest).toBeCalledTimes(1);
    expect(fnRequest).toHaveBeenNthCalledWith(1, "my-provider-c");

    jest.advanceTimersByTime(50);
    await (global as any).flushPromises();
    expect(getDataEntries()).toEqual([
      ["a", "result-a"],
      ["c", "result-c"],
    ]);

    expect(fnRequest).toBeCalledTimes(3);
    expect(fnRequest).toHaveBeenNthCalledWith(2, "my-provider-d");
    expect(fnRequest).toHaveBeenNthCalledWith(3, "my-provider-b");

    jest.advanceTimersByTime(30);
    await (global as any).flushPromises();
    expect(getDataEntries()).toEqual([
      ["a", "result-a"],
      ["c", "result-c"],
      ["d", "result-d"],
    ]);

    jest.advanceTimersByTime(70);
    await (global as any).flushPromises();
    expect(getDataEntries()).toEqual([
      ["a", "result-a"],
      ["c", "result-c"],
      ["d", "result-d"],
      ["b", "result-b"],
    ]);
  });

  it("should wait for using computed context", async () => {
    const getDataEntries = (): unknown =>
      [...ctx.get().entries()].map(([k, v]) => [k, (v as any).value]);

    ctx.deferDefine(
      [
        {
          name: "a",
          value: "result-a",
        },
        {
          name: "b",
          resolve: {
            useProvider: "my-provider-b",
            args: ["result-b", 20, "<% CTX.c %>"],
          },
          value: "initial",
        },
        {
          name: "c",
          resolve: {
            useProvider: "my-provider-c",
            args: ["result-c", 50, "<% CTX.a %>"],
          },
        },
      ],
      {} as any
    );

    let done = false;
    ctx.waitForUsedContext('<% CTX[false ? "c" : "a"] %>').then(() => {
      done = true;
    });

    expect(getDataEntries()).toEqual([]);

    await (global as any).flushPromises();
    expect(getDataEntries()).toEqual([["a", "result-a"]]);

    jest.advanceTimersByTime(50);
    await (global as any).flushPromises();
    expect(getDataEntries()).toEqual([
      ["a", "result-a"],
      ["c", "result-c"],
    ]);
    expect(done).toBe(false);

    jest.advanceTimersByTime(20);
    await (global as any).flushPromises();
    expect(getDataEntries()).toEqual([
      ["a", "result-a"],
      ["c", "result-c"],
      ["b", "result-b"],
    ]);
    expect(done).toBe(true);
  });

  it("should wait for all context", async () => {
    const getDataEntries = (): unknown =>
      [...ctx.get().entries()].map(([k, v]) => [k, (v as any).value]);

    ctx.deferDefine(
      [
        {
          name: "a",
          value: "result-a",
        },
        {
          name: "b",
          resolve: {
            useProvider: "my-provider-b",
            args: ["result-b", 20, "<% CTX.c %>"],
          },
          value: "initial",
        },
        {
          name: "c",
          resolve: {
            useProvider: "my-provider-c",
            args: ["result-c", 50, "<% CTX.a %>"],
          },
        },
      ],
      {} as any
    );

    let done = false;
    ctx.waitForAllContext().then(() => {
      done = true;
    });

    expect(getDataEntries()).toEqual([]);

    await (global as any).flushPromises();
    expect(getDataEntries()).toEqual([["a", "result-a"]]);

    jest.advanceTimersByTime(50);
    await (global as any).flushPromises();
    expect(getDataEntries()).toEqual([
      ["a", "result-a"],
      ["c", "result-c"],
    ]);
    expect(done).toBe(false);

    jest.advanceTimersByTime(20);
    await (global as any).flushPromises();
    expect(getDataEntries()).toEqual([
      ["a", "result-a"],
      ["c", "result-c"],
      ["b", "result-b"],
    ]);
    expect(done).toBe(true);
  });

  it("should work for nested deferDefine with ignored deps", async () => {
    ctx.deferDefine(
      [
        {
          name: "a",
          resolve: {
            if: false,
            useProvider: "my-provider-a",
            args: ["result-a", 100],
          },
        },
        {
          name: "b",
          value: "<% `a:${typeof CTX.a}` %>",
        },
      ],
      {} as any
    );

    await (global as any).flushPromises();
    await ctx.waitForAllContext();

    expect(fnRequest).toBeCalledTimes(0);
    expect(ctx.get().has("a")).toBe(false);
    expect(ctx.get().get("b")).toMatchObject({
      value: "a:undefined",
    });
  });
});

describe("batchUpdate should work", () => {
  const consoleLog = jest.spyOn(console, "log").mockImplementation();
  const brick = { properties: {} };
  const tplContext = new CustomTemplateContext(brick);
  const ctx = tplContext.state;
  const argsFactory = (arg: unknown[]): BatchUpdateContextItem => {
    return arg[0] as BatchUpdateContextItem;
  };
  beforeEach(async () => {
    let count = 0;
    jest.spyOn(runtime, "_internalApiGetResolver").mockReturnValue({
      async resolveOne(
        type: unknown,
        resolveConf: unknown,
        conf: Record<string, unknown>
      ) {
        await Promise.resolve();
        conf.value = `resolved:${count}`;
        count += 1;
      },
    } as any);

    await ctx.define(
      [
        {
          name: "a",
          value: 1,
          track: true,
          onChange: [
            {
              action: "console.log",
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
              action: "console.log",
              args: ["b change", "<% EVENT.detail %>"],
            },
          ],
        },
        {
          name: "c",
          value: `<% +STATE.a + +STATE.b %>`,
          track: true,
          onChange: [
            {
              action: "console.log",
              args: ["c change", "<% EVENT.detail %>"],
            },
          ],
        },
        {
          name: "d",
          value: `<% +STATE.c + 1 %>`,
          track: true,
          onChange: [
            {
              action: "console.log",
              args: ["d change", "<% EVENT.detail %>"],
            },
          ],
        },
      ],
      {
        tplContextId: tplContext.id,
      } as any,
      brick
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("update a, and c d should update once", async () => {
    ctx.updateValues(
      [
        {
          name: "a",
          value: 2,
        },
      ],
      "replace",
      argsFactory
    );

    expect(ctx.getValue("a")).toBe(2);
    expect(ctx.getValue("c")).toBe(4);
    expect(ctx.getValue("d")).toBe(5);
    expect(consoleLog).toBeCalledTimes(3);

    expect(consoleLog).toHaveBeenNthCalledWith(1, "a change", 2);
    expect(consoleLog).toHaveBeenNthCalledWith(2, "c change", 4);
    expect(consoleLog).toHaveBeenNthCalledWith(3, "d change", 5);
  });

  it("update a and b, c and d should update once", async () => {
    ctx.updateValues(
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

    expect(ctx.getValue("a")).toBe(2);
    expect(ctx.getValue("b")).toBe(3);
    expect(ctx.getValue("c")).toBe(5);
    expect(ctx.getValue("d")).toBe(6);
    expect(consoleLog).toBeCalledTimes(4);

    expect(consoleLog).toHaveBeenNthCalledWith(1, "a change", 2);
    expect(consoleLog).toHaveBeenNthCalledWith(2, "b change", 3);
    expect(consoleLog).toHaveBeenNthCalledWith(3, "c change", 5);
    expect(consoleLog).toHaveBeenNthCalledWith(4, "d change", 6);
  });

  it("update a and c, and d should update once", async () => {
    ctx.updateValues(
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

    expect(ctx.getValue("a")).toBe(2);
    expect(ctx.getValue("c")).toBe(0);
    expect(ctx.getValue("d")).toBe(1);
    expect(consoleLog).toBeCalledTimes(3);

    expect(consoleLog).toHaveBeenNthCalledWith(1, "a change", 2);
    expect(consoleLog).toHaveBeenNthCalledWith(2, "c change", 0);
    expect(consoleLog).toHaveBeenNthCalledWith(3, "d change", 1);
  });

  it("update c and a, and d should update once", async () => {
    ctx.updateValues(
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

    expect(ctx.getValue("a")).toBe(1);
    expect(ctx.getValue("c")).toBe(0);
    expect(ctx.getValue("d")).toBe(1);
    expect(consoleLog).toBeCalledTimes(3);

    expect(consoleLog).toHaveBeenNthCalledWith(1, "c change", 0);
    expect(consoleLog).toHaveBeenNthCalledWith(2, "a change", 1);
    expect(consoleLog).toHaveBeenNthCalledWith(3, "d change", 1);
  });

  it("update a, b, c, and d should update once", async () => {
    ctx.updateValues(
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

    expect(ctx.getValue("a")).toBe(10);
    expect(ctx.getValue("b")).toBe(20);
    expect(ctx.getValue("c")).toBe(100);
    expect(ctx.getValue("d")).toBe(101);
    expect(consoleLog).toBeCalledTimes(4);

    expect(consoleLog).toHaveBeenNthCalledWith(1, "a change", 10);
    expect(consoleLog).toHaveBeenNthCalledWith(2, "b change", 20);
    expect(consoleLog).toHaveBeenNthCalledWith(3, "c change", 100);
    expect(consoleLog).toHaveBeenNthCalledWith(4, "d change", 101);
  });

  it("update c, and d should update once", async () => {
    ctx.updateValues(
      [
        {
          name: "c",
          value: 20,
        },
      ],
      "replace",
      argsFactory
    );

    expect(ctx.getValue("c")).toBe(20);
    expect(ctx.getValue("d")).toBe(21);
    expect(consoleLog).toBeCalledTimes(2);

    expect(consoleLog).toHaveBeenNthCalledWith(1, "c change", 20);
    expect(consoleLog).toHaveBeenNthCalledWith(2, "d change", 21);
  });

  it("update d c, not emit", async () => {
    ctx.updateValues(
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

    expect(ctx.getValue("d")).toBe(10);
    expect(ctx.getValue("c")).toBe(20);
    expect(consoleLog).toBeCalledTimes(2);

    expect(consoleLog).toHaveBeenNthCalledWith(1, "d change", 10);
    expect(consoleLog).toHaveBeenNthCalledWith(2, "c change", 20);
  });

  it("not allow to update same item", () => {
    expect(() => {
      ctx.updateValues(
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
  const consoleLog = jest.spyOn(console, "log").mockImplementation();
  const brick = { properties: {} };
  const tplContext = new CustomTemplateContext(brick);
  const ctx = tplContext.state;
  const argsFactory = (arg: unknown[]): BatchUpdateContextItem => {
    return arg[0] as BatchUpdateContextItem;
  };
  beforeEach(async () => {
    let count = 0;
    jest.spyOn(runtime, "_internalApiGetResolver").mockReturnValue({
      async resolveOne(
        type: unknown,
        resolveConf: unknown,
        conf: Record<string, unknown>
      ) {
        await Promise.resolve();
        conf.value = `resolved:${count}`;
        count += 1;
      },
    } as any);

    await ctx.define(
      [
        {
          name: "a",
          value: 1,
          track: true,
          onChange: [
            {
              action: "console.log",
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
              action: "console.log",
              args: ["b change", "<% EVENT.detail %>"],
            },
          ],
        },
        {
          name: "c",
          value: `<% +STATE.a + +STATE.b %>`,
          track: true,
          onChange: [
            {
              action: "console.log",
              args: ["c change", "<% EVENT.detail %>"],
            },
          ],
        },
        {
          name: "d",
          value: `<% +STATE.c + 1 %>`,
          track: true,
          onChange: [
            {
              action: "console.log",
              args: ["d change", "<% EVENT.detail %>"],
            },
          ],
        },
        // Note: this is a state with resolve
        {
          name: "e",
          resolve: {
            useProvider: "my-provider",
            args: ["<% STATE.a %>"],
          },
          track: true,
          onChange: {
            action: "console.log",
            args: ["e change", "<% EVENT.detail %>"],
          },
        },
      ],
      {
        tplContextId: tplContext.id,
      } as any,
      brick
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("update a, then c d should update once, then later e should update once", async () => {
    ctx.updateValues(
      [
        {
          name: "a",
          value: 2,
        },
      ],
      "replace",
      argsFactory
    );

    expect(ctx.getValue("a")).toBe(2);
    expect(ctx.getValue("c")).toBe(4);
    expect(ctx.getValue("d")).toBe(5);
    expect(ctx.getValue("e")).toBe("resolved:0");
    expect(consoleLog).toBeCalledTimes(3);

    expect(consoleLog).toHaveBeenNthCalledWith(1, "a change", 2);
    expect(consoleLog).toHaveBeenNthCalledWith(2, "c change", 4);
    expect(consoleLog).toHaveBeenNthCalledWith(3, "d change", 5);

    // `e` should only be changed after it's been resolved.
    await (global as any).flushPromises();
    expect(ctx.getValue("e")).toBe("resolved:1");
    expect(consoleLog).toBeCalledTimes(4);
    expect(consoleLog).toHaveBeenNthCalledWith(4, "e change", "resolved:1");
  });
});

describe("batch context resolve with trigger should work", () => {
  const consoleError = jest.spyOn(console, "error").mockImplementation();

  beforeEach(async () => {
    jest.spyOn(runtime, "_internalApiGetResolver").mockReturnValue({
      async resolveOne(
        type: unknown,
        resolveConf: unknown,
        conf: Record<string, unknown>
      ) {
        await Promise.resolve();
      },
    } as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should batch lifecycle and context name when resolve has been set Trigger ", async () => {
    const brick = { properties: {} };
    const ctx = new StoryboardContextWrapper();
    await ctx.define(
      [
        {
          name: "a",
          value: 1,
          track: true,
          onChange: [
            {
              action: "console.log",
              args: ["a change", "<% EVENT.detail %>"],
            },
          ],
        },
        // Note: this is a state with resolve
        {
          name: "b",
          resolve: {
            useProvider: "my-provider",
            args: ["b1"],
            lazy: true,
            trigger: "onPageLoad",
          },
          onChange: {
            action: "console.log",
            args: ["e change", "<% EVENT.detail %>"],
          },
        },
        {
          name: "c",
          resolve: {
            useProvider: "my-provider",
            args: ["<% c1 %>"],
            lazy: true,
            trigger: "onBeforePageLeave",
          },
          onChange: {
            action: "console.log",
            args: ["e change", "<% EVENT.detail %>"],
          },
        },
        {
          name: "d",
          resolve: {
            useProvider: "my-provider",
            args: ["<% d1 %>"],
            lazy: true,
            trigger: "onPageLeave",
          },
          onChange: {
            action: "console.log",
            args: ["e change", "<% EVENT.detail %>"],
          },
        },
        {
          name: "e",
          resolve: {
            useProvider: "my-provider",
            args: ["<% e1 %>"],
            lazy: true,
            trigger: "onAnchorLoad",
          },
          onChange: {
            action: "console.log",
            args: ["e change", "<% EVENT.detail %>"],
          },
        },
        {
          name: "f",
          resolve: {
            useProvider: "my-provider",
            args: ["<% f1 %>"],
            lazy: true,
            trigger: "onAnchorUnload",
          },
          onChange: {
            action: "console.log",
            args: ["e change", "<% EVENT.detail %>"],
          },
        },
        {
          name: "g",
          resolve: {
            useProvider: "my-provider",
            args: ["<% g1 %>"],
            lazy: true,
            trigger: "onScrollIntoView" as any,
          },
          onChange: {
            action: "console.log",
            args: ["e change", "<% EVENT.detail %>"],
          },
        },
        {
          name: "h",
          resolve: {
            useProvider: "my-provider",
            args: ["<% h1 %>"],
            lazy: true,
            trigger: "onMediaChange" as any,
          },
          onChange: {
            action: "console.log",
            args: ["e change", "<% EVENT.detail %>"],
          },
        },
        {
          name: "i",
          resolve: {
            useProvider: "my-provider",
            args: ["i1"],
            lazy: true,
            trigger: "onBeforePageLoad",
          },
          onChange: {
            action: "console.log",
            args: ["e change", "<% EVENT.detail %>"],
          },
        },
        {
          name: "j",
          resolve: {
            useProvider: "my-provider",
            args: ["j1"],
            lazy: true,
            trigger: "onBeforePageLoad",
          },
          onChange: {
            action: "console.log",
            args: ["e change", "<% EVENT.detail %>"],
          },
        },
      ],
      {
        tplContextId: "tpl-ctx-1",
      } as any,
      brick
    );
    expect(
      Array.from(ctx.getContextTriggerSetByLifecycle("onPageLoad"))
    ).toEqual([{ name: "b", tplContextId: undefined, type: "context" }]);
    expect(
      Array.from(ctx.getContextTriggerSetByLifecycle("onBeforePageLoad"))
    ).toEqual([
      { name: "i", tplContextId: undefined, type: "context" },
      { name: "j", tplContextId: undefined, type: "context" },
    ]);
    expect(
      Array.from(ctx.getContextTriggerSetByLifecycle("onBeforePageLeave"))
    ).toEqual([{ name: "c", tplContextId: undefined, type: "context" }]);
    expect(
      Array.from(ctx.getContextTriggerSetByLifecycle("onPageLeave"))
    ).toEqual([{ name: "d", tplContextId: undefined, type: "context" }]);
    expect(
      Array.from(ctx.getContextTriggerSetByLifecycle("onAnchorLoad"))
    ).toEqual([{ name: "e", tplContextId: undefined, type: "context" }]);
    expect(
      Array.from(ctx.getContextTriggerSetByLifecycle("onAnchorUnload"))
    ).toEqual([{ name: "f", tplContextId: undefined, type: "context" }]);
    expect(
      Array.from(ctx.getContextTriggerSetByLifecycle("onScrollIntoView" as any))
    ).toHaveLength(0);
    expect(
      Array.from(ctx.getContextTriggerSetByLifecycle("onMediaChange" as any))
    ).toHaveLength(0);

    expect(consoleError).toHaveBeenNthCalledWith(
      1,
      `unsupported lifecycle: "onScrollIntoView"`
    );
    expect(consoleError).toHaveBeenNthCalledWith(
      2,
      `unsupported lifecycle: "onMediaChange"`
    );
  });

  it("should batch lifecycle and context name when  resolve has been set Trigger for tpl context ", async () => {
    const brick = { properties: {} };
    const ctx = new StoryboardContextWrapper("tpl-ctx-1");
    await ctx.define(
      [
        {
          name: "a",
          value: 1,
          track: true,
          onChange: [
            {
              action: "console.log",
              args: ["a change", "<% EVENT.detail %>"],
            },
          ],
        },
        // Note: this is a state with resolve
        {
          name: "b",
          resolve: {
            useProvider: "my-provider",
            args: ["b1"],
            lazy: true,
            trigger: "onPageLoad",
          },
          onChange: {
            action: "console.log",
            args: ["e change", "<% EVENT.detail %>"],
          },
        },
        {
          name: "c",
          resolve: {
            useProvider: "my-provider",
            args: ["<% c1 %>"],
            lazy: true,
            trigger: "onBeforePageLeave",
          },
          onChange: {
            action: "console.log",
            args: ["e change", "<% EVENT.detail %>"],
          },
        },
        {
          name: "d",
          resolve: {
            useProvider: "my-provider",
            args: ["<% d1 %>"],
            lazy: true,
            trigger: "onPageLeave",
          },
          onChange: {
            action: "console.log",
            args: ["e change", "<% EVENT.detail %>"],
          },
        },
        {
          name: "e",
          resolve: {
            useProvider: "my-provider",
            args: ["<% e1 %>"],
            lazy: true,
            trigger: "onAnchorLoad",
          },
          onChange: {
            action: "console.log",
            args: ["e change", "<% EVENT.detail %>"],
          },
        },
        {
          name: "f",
          resolve: {
            useProvider: "my-provider",
            args: ["<% f1 %>"],
            lazy: true,
            trigger: "onAnchorUnload",
          },
          onChange: {
            action: "console.log",
            args: ["e change", "<% EVENT.detail %>"],
          },
        },
        {
          name: "g",
          resolve: {
            useProvider: "my-provider",
            args: ["<% g1 %>"],
            lazy: true,
            trigger: "onScrollIntoView" as any,
          },
          onChange: {
            action: "console.log",
            args: ["e change", "<% EVENT.detail %>"],
          },
        },
        {
          name: "h",
          resolve: {
            useProvider: "my-provider",
            args: ["<% h1 %>"],
            lazy: true,
            trigger: "onMediaChange" as any,
          },
          onChange: {
            action: "console.log",
            args: ["e change", "<% EVENT.detail %>"],
          },
        },
        {
          name: "i",
          resolve: {
            useProvider: "my-provider",
            args: ["i1"],
            lazy: true,
            trigger: "onBeforePageLoad",
          },
          onChange: {
            action: "console.log",
            args: ["e change", "<% EVENT.detail %>"],
          },
        },
        {
          name: "j",
          resolve: {
            useProvider: "my-provider",
            args: ["j1"],
            lazy: true,
            trigger: "onBeforePageLoad",
          },
          onChange: {
            action: "console.log",
            args: ["e change", "<% EVENT.detail %>"],
          },
        },
      ],
      {
        tplContextId: "tpl-ctx-1",
      } as any,
      brick
    );
    expect(
      Array.from(ctx.getContextTriggerSetByLifecycle("onPageLoad"))
    ).toEqual([{ name: "b", tplContextId: "tpl-ctx-1", type: "state" }]);
    expect(
      Array.from(ctx.getContextTriggerSetByLifecycle("onBeforePageLoad"))
    ).toEqual([
      { name: "i", tplContextId: "tpl-ctx-1", type: "state" },
      { name: "j", tplContextId: "tpl-ctx-1", type: "state" },
    ]);
    expect(
      Array.from(ctx.getContextTriggerSetByLifecycle("onBeforePageLeave"))
    ).toEqual([{ name: "c", tplContextId: "tpl-ctx-1", type: "state" }]);
    expect(
      Array.from(ctx.getContextTriggerSetByLifecycle("onPageLeave"))
    ).toEqual([{ name: "d", tplContextId: "tpl-ctx-1", type: "state" }]);
    expect(
      Array.from(ctx.getContextTriggerSetByLifecycle("onAnchorLoad"))
    ).toEqual([{ name: "e", tplContextId: "tpl-ctx-1", type: "state" }]);
    expect(
      Array.from(ctx.getContextTriggerSetByLifecycle("onAnchorUnload"))
    ).toEqual([{ name: "f", tplContextId: "tpl-ctx-1", type: "state" }]);
    expect(
      Array.from(ctx.getContextTriggerSetByLifecycle("onScrollIntoView" as any))
    ).toHaveLength(0);
    expect(
      Array.from(ctx.getContextTriggerSetByLifecycle("onMediaChange" as any))
    ).toHaveLength(0);

    expect(consoleError).toHaveBeenNthCalledWith(
      1,
      `unsupported lifecycle: "onScrollIntoView"`
    );
    expect(consoleError).toHaveBeenNthCalledWith(
      2,
      `unsupported lifecycle: "onMediaChange"`
    );
  });
});
