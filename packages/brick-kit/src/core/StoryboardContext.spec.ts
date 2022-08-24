import { RuntimeBrickElement } from "@next-core/brick-types";
import { CustomTemplateContext } from "./CustomTemplates/CustomTemplateContext";
import { StoryboardContextWrapper } from "./StoryboardContext";
import * as runtime from "./Runtime";

const consoleWarn = jest
  .spyOn(console, "warn")
  .mockImplementation(() => void 0);

let resolveValue = "lazily updated";
const resolveOne = jest.fn(
  async (a: unknown, b: unknown, c: Record<string, unknown>) => {
    await Promise.resolve();
    c.value = resolveValue;
  }
);
jest.spyOn(runtime, "_internalApiGetResolver").mockReturnValue({
  resolveOne,
} as any);

describe("StoryboardContextWrapper", () => {
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
    ctx.updateValue("asyncValue", undefined, "refresh");
    expect(ctx.getValue("asyncValue")).toBe("initial");

    await (global as any).flushPromises();
    expect(ctx.getValue("asyncValue")).toBe("lazily updated");
    expect(ctx.getValue("processedData")).toBe("processed: lazily updated");
  });

  it("should refresh when deps updated", async () => {
    const brick = { properties: {} };
    const tplContext = new CustomTemplateContext(brick);
    const ctx = tplContext.state;

    const originalResolveValue = resolveValue;
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

    expect(ctx.getValue("asyncValue")).toBe("initial");
    expect(ctx.getValue("dep")).toBe("first");

    resolveValue = originalResolveValue;
    ctx.updateValue("dep", "second", "replace");
    expect(ctx.getValue("dep")).toBe("second");
    expect(ctx.getValue("asyncValue")).toBe("initial");

    await (global as any).flushPromises();
    expect(ctx.getValue("asyncValue")).toBe("lazily updated");
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
