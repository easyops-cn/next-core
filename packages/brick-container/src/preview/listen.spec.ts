import { jest, describe, test, expect } from "@jest/globals";
import { loadBricksImperatively } from "@next-core/loader";
import { createProviderClass } from "@next-core/utils/general";
import { listen } from "./listen.js";
import initialize from "./initialize.js";

jest.mock("@next-core/loader");
jest.mock("./initialize.js");

const injectPreview = jest.fn();
customElements.define(
  "visual-builder.inject-preview-agent",
  createProviderClass(injectPreview)
);

const injectUITest = jest.fn();
customElements.define(
  "ui-test.inject-preview-agent",
  createProviderClass(injectUITest)
);

const mockInitialize = initialize as jest.MockedFunction<typeof initialize>;

describe("listen", () => {
  test("preview", async () => {
    listen(Promise.resolve("ok"));
    mockInitialize.mockResolvedValueOnce(true);

    window.dispatchEvent(
      new MessageEvent("message", {
        origin: location.origin,
        data: {
          sender: "preview-container",
          type: "start-preview",
          options: {
            agent: {
              brick: "visual-builder.inject-preview-agent",
              pkg: {
                id: "bricks/visual-builder",
              },
            },
            foo: "bar",
          },
        },
      })
    );

    await (global as any).flushPromises();

    expect(loadBricksImperatively).toBeCalledWith(
      ["visual-builder.inject-preview-agent"],
      [
        {
          id: "bricks/visual-builder",
        },
      ]
    );
    expect(injectPreview).toBeCalledWith(location.origin, {
      foo: "bar",
    });
  });

  test("ui-test preview", async () => {
    listen(Promise.resolve("ok"));
    mockInitialize.mockResolvedValueOnce(true);

    window.dispatchEvent(
      new MessageEvent("message", {
        origin: location.origin,
        data: {
          channel: "ui-test-preview",
          type: "initialize",
          payload: {
            agent: {
              brick: "ui-test.inject-preview-agent",
              pkg: {
                id: "bricks/ui-test",
              },
            },
            options: {
              foo: "bar",
            },
          },
        },
      })
    );

    await (global as any).flushPromises();

    expect(loadBricksImperatively).toBeCalledWith(
      ["ui-test.inject-preview-agent"],
      [
        {
          id: "bricks/ui-test",
        },
      ]
    );
    expect(injectUITest).toBeCalledWith(location.origin, {
      foo: "bar",
    });
  });

  test("unrelated message", async () => {
    listen(Promise.resolve("ok"));

    window.dispatchEvent(
      new MessageEvent("message", {
        origin: location.origin,
      })
    );

    await (global as any).flushPromises();

    expect(loadBricksImperatively).not.toBeCalled();
  });

  test("initialize failed", async () => {
    listen(Promise.resolve("ok"));
    mockInitialize.mockResolvedValueOnce(false);

    window.dispatchEvent(
      new MessageEvent("message", {
        origin: location.origin,
        data: {
          channel: "ui-test-preview",
          type: "initialize",
          payload: {
            agent: {
              brick: "ui-test.inject-preview-agent",
              pkg: {
                id: "bricks/ui-test",
              },
            },
            options: {
              foo: "bar",
            },
          },
        },
      })
    );

    await (global as any).flushPromises();

    expect(loadBricksImperatively).not.toBeCalled();
  });
});
