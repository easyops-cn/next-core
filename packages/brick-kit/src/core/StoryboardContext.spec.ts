import { ResolveOptions, RuntimeBrickElement } from "@next-core/brick-types";
import { CustomTemplateContext } from "./CustomTemplates/CustomTemplateContext";
import { StoryboardContextWrapper } from "./StoryboardContext";
import * as runtime from "./Runtime";

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
jest.spyOn(runtime, "_internalApiGetResolver").mockReturnValue({
  resolveOne,
} as any);

describe("StoryboardContextWrapper", () => {
  beforeEach(() => {
    resolveValue = "lazily updated";
    rejectReason = undefined;
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

  it("should load", async () => {
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
    // Trigger load twice.
    ctx.updateValue("asyncValue", undefined, "load", {
      success: {
        action: "console.info",
        args: ["[1] success", "<% EVENT.detail %>"],
      },
      finally: {
        action: "console.info",
        args: ["[1] finally", "<% EVENT.detail %>"],
      },
    });
    ctx.updateValue("asyncValue", undefined, "load", {
      success: {
        action: "console.info",
        args: ["[2] success", "<% EVENT.detail %>"],
      },
      finally: {
        action: "console.info",
        args: ["[2] finally", "<% EVENT.detail %>"],
      },
    });
    expect(ctx.getValue("asyncValue")).toBe("initial");
    expect(consoleInfo).not.toBeCalled();

    await (global as any).flushPromises();
    // Will not load again if it is already LOADING.
    expect(resolveOne).toBeCalledTimes(1);
    expect(ctx.getValue("asyncValue")).toBe("[cache:default] lazily updated");
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

    ctx.updateValue("asyncValue", undefined, "load", {
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

  it("should listen on state.change", () => {
    const brick = {
      element: document.createElement("div") as RuntimeBrickElement,
    };
    const refElement = document.createElement("span");
    brick.element.$$getElementByRef = () => refElement;
    const tplContext = new CustomTemplateContext(brick);
    tplContext.state.define(
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
});
